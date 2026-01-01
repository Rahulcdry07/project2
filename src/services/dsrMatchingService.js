/**
 * DSR Matching Service
 * Handles fuzzy matching of extracted PDF text to DSR items for cost estimation
 */

const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DSRMatchingService {
  constructor(dsrModel) {
    this.DSRItem = dsrModel;
  }

  /**
   * Extract line items from PDF JSON
   * @param {Object} pdfData - Converted PDF JSON data
   * @returns {Array} Extracted line items
   */
  extractLineItems(pdfData) {
    const items = [];

    if (!pdfData.pages) return items;

    pdfData.pages.forEach(page => {
      // Extract from text
      if (page.text) {
        const lines = page.text.split('\n');
        lines.forEach(line => {
          const item = this.parseLineItem(line);
          if (item) items.push(item);
        });
      }

      // Extract from tables
      if (page.tables) {
        page.tables.forEach(table => {
          table.rows.forEach((row, index) => {
            if (index === 0) return; // Skip header
            const item = this.parseTableRow(row);
            if (item) items.push(item);
          });
        });
      }
    });

    return items;
  }

  /**
   * Parse a line of text to extract item details
   * @param {string} line - Text line
   * @returns {Object|null} Parsed item or null
   */
  parseLineItem(line) {
    // Common patterns for construction items
    // Example: "Cement 43 Grade - 100 bags @ 450 per bag"
    // Example: "Excavation in ordinary soil - 50 cum"

    const patterns = [
      // Pattern: Description - Quantity Unit
      /^(.+?)\s*-\s*(\d+\.?\d*)\s*(sqm|cum|rmt|kg|nos|sqft|cft|ton|ltr|bag|bags?|set|each|pair|dozen)/i,
      // Pattern: Description Quantity Unit
      /^(.+?)\s+(\d+\.?\d*)\s+(sqm|cum|rmt|kg|nos|sqft|cft|ton|ltr|bag|bags?|set|each|pair|dozen)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          description: match[1].trim(),
          quantity: parseFloat(match[2]),
          unit: this.normalizeUnit(match[3]),
          raw_text: line,
        };
      }
    }

    return null;
  }

  /**
   * Parse a table row to extract item details
   * @param {Array} row - Table row cells
   * @returns {Object|null} Parsed item or null
   */
  parseTableRow(row) {
    if (row.length < 2) return null;

    // Common table formats:
    // [Description, Quantity, Unit, Rate]
    // [S.No, Description, Quantity, Unit, Rate, Amount]

    let description, quantity, unit;

    if (row.length >= 3) {
      // Try to find quantity and unit columns
      for (let i = 0; i < row.length; i++) {
        const cell = String(row[i]).trim();
        const qtyMatch = cell.match(
          /^(\d+\.?\d*)\s*(sqm|cum|rmt|kg|nos|sqft|cft|ton|ltr|bag|bags?|set|each|pair|dozen)?$/i
        );

        if (qtyMatch) {
          quantity = parseFloat(qtyMatch[1]);
          unit = qtyMatch[2]
            ? this.normalizeUnit(qtyMatch[2])
            : row[i + 1]
              ? this.normalizeUnit(row[i + 1])
              : null;
          description = row[i - 1] || row[0];
          break;
        }
      }
    }

    if (description && quantity) {
      return {
        description: String(description).trim(),
        quantity,
        unit: unit || 'nos',
        raw_text: row.join(' '),
      };
    }

    return null;
  }

  /**
   * Normalize unit names
   * @param {string} unit - Unit string
   * @returns {string} Normalized unit
   */
  normalizeUnit(unit) {
    const unitMap = {
      bags: 'bag',
      bag: 'bag',
      sqm: 'sqm',
      cum: 'cum',
      cft: 'cft',
      sqft: 'sqft',
      rmt: 'rmt',
      kg: 'kg',
      nos: 'nos',
      ton: 'ton',
      ltr: 'ltr',
      set: 'set',
      each: 'each',
      pair: 'pair',
      dozen: 'dozen',
    };

    return unitMap[unit.toLowerCase()] || unit.toLowerCase();
  }

  /**
   * Match extracted items with DSR database
   * @param {Array} extractedItems - Items extracted from PDF
   * @returns {Array} Matched items with DSR data
   */
  async matchWithDSR(extractedItems) {
    const matches = [];

    for (const item of extractedItems) {
      try {
        const dsrMatches = await this.findDSRMatches(item.description);

        if (dsrMatches.length > 0) {
          const bestMatch = dsrMatches[0];
          matches.push({
            extracted: item,
            dsr_item: {
              id: bestMatch.id,
              item_code: bestMatch.item_code,
              description: bestMatch.description,
              unit: bestMatch.unit,
              rate: parseFloat(bestMatch.rate),
              category: bestMatch.category,
            },
            match_score: this.calculateSimilarity(item.description, bestMatch.description),
            all_matches: dsrMatches.slice(0, 3).map(m => ({
              item_code: m.item_code,
              description: m.description,
              rate: parseFloat(m.rate),
              unit: m.unit,
            })),
          });
        } else {
          matches.push({
            extracted: item,
            dsr_item: null,
            match_score: 0,
            all_matches: [],
          });
        }
      } catch (error) {
        logger.error('Error matching DSR item:', { item: item.description, error: error.message });
        matches.push({
          extracted: item,
          dsr_item: null,
          match_score: 0,
          error: error.message,
        });
      }
    }

    return matches;
  }

  /**
   * Find DSR items matching description
   * @param {string} description - Item description
   * @returns {Array} Matching DSR items
   */
  async findDSRMatches(description) {
    const normalizedDesc = description.toLowerCase().trim();

    // First, try exact matches or very close matches
    let exactMatches = await this.DSRItem.findAll({
      where: {
        is_active: true,
        description: {
          [Op.iLike]: normalizedDesc,
        },
      },
      limit: 5,
    });

    if (exactMatches.length > 0) {
      return exactMatches.map(item => ({
        ...item.toJSON(),
        similarity: 1.0,
      }));
    }

    // Try partial matches (description contains the search term or vice versa)
    const partialMatches = await this.DSRItem.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { description: { [Op.iLike]: `%${normalizedDesc}%` } },
          // Also check if search term contains DSR description
          ...normalizedDesc
            .split(/\s+/)
            .map(word => (word.length > 3 ? { description: { [Op.iLike]: `%${word}%` } } : null))
            .filter(Boolean),
        ],
      },
      limit: 10,
    });

    // Calculate similarity scores and sort
    const scoredMatches = partialMatches
      .map(item => ({
        ...item.toJSON(),
        similarity: this.calculateSimilarity(normalizedDesc, item.description.toLowerCase()),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    // Filter out very low similarity matches (below 0.3)
    return scoredMatches.filter(match => match.similarity >= 0.3);
  }

  /**
   * Extract keywords from description
   * @param {string} description - Item description
   * @returns {Array} Keywords
   */
  extractKeywords(description) {
    // Remove common words
    const stopWords = [
      'in',
      'of',
      'the',
      'and',
      'or',
      'for',
      'with',
      'to',
      'from',
      'as',
      'per',
      'including',
    ];

    const words = description
      .toLowerCase()
      .split(/[\s,-]+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Calculate similarity score between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Exact match
    if (s1 === s2) return 1.0;

    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      // Higher score if the shorter string is contained in the longer one
      const shorter = s1.length <= s2.length ? s1 : s2;
      const longer = s1.length > s2.length ? s1 : s2;
      return (shorter.length / longer.length) * 0.9;
    }

    // Enhanced keyword matching with synonyms
    const words1 = this.extractKeywords(s1);
    const words2 = this.extractKeywords(s2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Calculate base similarity from direct matches
    const directMatches = words1.filter(word => words2.includes(word));
    const synonymMatches = this.findSynonymMatches(words1, words2);
    const commonWords = [...new Set([...directMatches, ...synonymMatches])];

    const totalUniqueWords = new Set([...words1, ...words2]).size;
    if (totalUniqueWords === 0) return 0;

    // Base similarity from common words (direct + synonyms)
    let similarity = commonWords.length / totalUniqueWords;

    // Boost for direct matches over synonyms
    const directMatchBonus = directMatches.length * 0.1;
    similarity += Math.min(directMatchBonus, 0.3);

    // Boost for consecutive word matches
    const consecutiveMatches = this.countConsecutiveMatches(words1, words2);
    if (consecutiveMatches > 0) {
      similarity += (consecutiveMatches / Math.max(words1.length, words2.length)) * 0.2;
    }

    // Boost for same word order
    if (this.hasSameWordOrder(words1, words2, directMatches)) {
      similarity += 0.1;
    }

    return Math.min(similarity, 1.0);
  }

  /**
   * Find synonym matches between word arrays
   * @param {Array} words1 - First word array
   * @param {Array} words2 - Second word array
   * @returns {Array} Words that have synonyms in the other array
   */
  findSynonymMatches(words1, words2) {
    const synonyms = {
      excavation: ['earthwork', 'digging', 'trenching'],
      earthwork: ['excavation', 'digging', 'trenching'],
      concrete: ['cement', 'rcc', 'reinforced'],
      cement: ['concrete', 'rcc'],
      masonry: ['brickwork', 'brick', 'blockwork'],
      brickwork: ['masonry', 'brick'],
      plastering: ['plaster', 'finishing'],
      painting: ['paint', 'finishing'],
      flooring: ['floor', 'tiles'],
      carpentry: ['woodwork', 'wood'],
      electrical: ['electric', 'wiring'],
      plumbing: ['pipes', 'water', 'sanitation'],
    };

    const matches = [];

    // Check each word in words1 for synonyms in words2
    for (const word1 of words1) {
      if (words2.includes(word1)) continue; // Already counted as direct match

      const wordSynonyms = synonyms[word1];
      if (wordSynonyms) {
        for (const synonym of wordSynonyms) {
          if (words2.includes(synonym)) {
            matches.push(word1);
            break;
          }
        }
      }
    }

    // Also check each word in words2 for synonyms in words1 (bidirectional)
    for (const word2 of words2) {
      if (words1.includes(word2)) continue; // Already counted

      const wordSynonyms = synonyms[word2];
      if (wordSynonyms) {
        for (const synonym of wordSynonyms) {
          if (words1.includes(synonym)) {
            matches.push(word2);
            break;
          }
        }
      }
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Count consecutive word matches between two arrays
   * @param {Array} words1 - First word array
   * @param {Array} words2 - Second word array
   * @returns {number} Number of consecutive matches
   */
  countConsecutiveMatches(words1, words2) {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (let i = 0; i < words1.length; i++) {
      if (words2.includes(words1[i])) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  /**
   * Check if common words appear in same relative order
   * @param {Array} words1 - First word array
   * @param {Array} words2 - Second word array
   * @param {Array} commonWords - Common words
   * @returns {boolean} Whether words appear in same order
   */
  hasSameWordOrder(words1, words2, commonWords) {
    if (commonWords.length < 2) return false;

    const indices1 = commonWords.map(word => words1.indexOf(word)).filter(idx => idx !== -1);
    const indices2 = commonWords.map(word => words2.indexOf(word)).filter(idx => idx !== -1);

    if (indices1.length !== indices2.length) return false;

    // Check if relative order is maintained
    for (let i = 1; i < indices1.length; i++) {
      if (indices1[i] > indices1[i - 1] !== indices2[i] > indices2[i - 1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate cost estimate from matched items
   * @param {Array} matches - Matched items with DSR data
   * @returns {Object} Cost estimate
   */
  calculateCost(matches) {
    let totalCost = 0;
    let matchedItemsCount = 0;
    let unmatchedItemsCount = 0;

    const itemBreakdown = matches.map(match => {
      if (match.dsr_item) {
        const quantity = match.extracted.quantity || 0;
        const rate = match.dsr_item.rate;
        const itemCost = quantity * rate;

        totalCost += itemCost;
        matchedItemsCount++;

        return {
          description: match.extracted.description,
          quantity: quantity,
          unit: match.extracted.unit || match.dsr_item.unit,
          rate: rate,
          amount: itemCost,
          dsr_code: match.dsr_item.item_code,
          match_confidence: match.match_score,
          matched: true,
        };
      } else {
        unmatchedItemsCount++;
        return {
          description: match.extracted.description,
          quantity: match.extracted.quantity || 0,
          unit: match.extracted.unit,
          rate: 0,
          amount: 0,
          matched: false,
        };
      }
    });

    return {
      total_cost: totalCost,
      matched_items: matchedItemsCount,
      unmatched_items: unmatchedItemsCount,
      total_items: matches.length,
      match_percentage: matches.length > 0 ? (matchedItemsCount / matches.length) * 100 : 0,
      breakdown: itemBreakdown,
    };
  }
}

module.exports = DSRMatchingService;
