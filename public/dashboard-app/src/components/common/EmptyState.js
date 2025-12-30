import PropTypes from 'prop-types';

const EmptyState = ({ icon = 'bi-inbox', title, description, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="empty-state__title">{title}</div>
      {description && <p className="empty-state__description">{description}</p>}
      {action}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node
};

export default EmptyState;
