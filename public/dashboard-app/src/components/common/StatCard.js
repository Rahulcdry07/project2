import PropTypes from 'prop-types';

const StatCard = ({ icon, label, value, trendLabel, trendDirection = 'neutral', variant = 'default' }) => {
  const trendIcon = {
    up: 'bi-arrow-up-right',
    down: 'bi-arrow-down-right',
    neutral: 'bi-dot'
  }[trendDirection] || 'bi-dot';

  const variantClass = {
    warning: 'stat-card--warning',
    success: 'stat-card--success'
  }[variant] || '';

  return (
    <div className={`stat-card ${variantClass}`}>
      <span className="stat-card__icon">
        <i className={`bi ${icon}`} aria-hidden="true"></i>
      </span>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {trendLabel && (
        <div className="stat-card__trend">
          <i className={`bi ${trendIcon}`} aria-hidden="true"></i>
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trendLabel: PropTypes.string,
  trendDirection: PropTypes.oneOf(['up', 'down', 'neutral']),
  variant: PropTypes.oneOf(['default', 'warning', 'success'])
};

export default StatCard;
