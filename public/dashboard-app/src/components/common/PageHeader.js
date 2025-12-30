import PropTypes from 'prop-types';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="page-header">
      <div className="page-header__title-group">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node
};

export default PageHeader;
