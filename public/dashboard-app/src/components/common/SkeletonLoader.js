import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable skeleton loader component for showing placeholder content while data loads
 */

// Base skeleton pulse animation styles
const pulseStyle = {
  animation: 'pulse 1.5s ease-in-out infinite',
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
};

// Add keyframes to document if not already present
if (typeof document !== 'undefined' && !document.querySelector('#skeleton-keyframes')) {
  const style = document.createElement('style');
  style.id = 'skeleton-keyframes';
  style.innerHTML = `
    @keyframes pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Generic skeleton box
 */
export const SkeletonBox = ({ width = '100%', height = '20px', className = '', borderRadius = '4px' }) => (
  <div
    className={`skeleton-box ${className}`}
    style={{
      ...pulseStyle,
      width,
      height,
      borderRadius,
      marginBottom: '8px',
    }}
    aria-hidden="true"
  />
);

SkeletonBox.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string,
  borderRadius: PropTypes.string,
};

/**
 * Skeleton for table rows
 */
export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="table-responsive">
    <table className="table">
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, idx) => (
            <th key={idx}>
              <SkeletonBox height="16px" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={colIdx}>
                <SkeletonBox height="14px" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

/**
 * Skeleton for card content
 */
export const SkeletonCard = ({ hasImage = false, lines = 3 }) => (
  <div className="card">
    <div className="card-body">
      {hasImage && <SkeletonBox height="180px" borderRadius="8px" />}
      <SkeletonBox width="60%" height="24px" className="mb-3" />
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBox
          key={idx}
          width={idx === lines - 1 ? '80%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  </div>
);

SkeletonCard.propTypes = {
  hasImage: PropTypes.bool,
  lines: PropTypes.number,
};

/**
 * Skeleton for profile/form layout
 */
export const SkeletonForm = ({ fields = 4 }) => (
  <div className="card">
    <div className="card-body">
      <SkeletonBox width="40%" height="28px" className="mb-4" />
      {Array.from({ length: fields }).map((_, idx) => (
        <div key={idx} className="mb-3">
          <SkeletonBox width="30%" height="16px" />
          <SkeletonBox height="38px" borderRadius="6px" />
        </div>
      ))}
      <SkeletonBox width="120px" height="38px" borderRadius="6px" />
    </div>
  </div>
);

SkeletonForm.propTypes = {
  fields: PropTypes.number,
};

/**
 * Skeleton for dashboard stats
 */
export const SkeletonStats = ({ count = 3 }) => (
  <div className="row">
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="col-md-4 mb-3">
        <div className="card">
          <div className="card-body">
            <SkeletonBox width="50%" height="16px" />
            <SkeletonBox width="70%" height="32px" className="mt-2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

SkeletonStats.propTypes = {
  count: PropTypes.number,
};

export default {
  Box: SkeletonBox,
  Table: SkeletonTable,
  Card: SkeletonCard,
  Form: SkeletonForm,
  Stats: SkeletonStats,
};
