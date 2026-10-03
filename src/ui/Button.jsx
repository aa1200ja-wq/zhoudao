export default function Button({
  variant = 'secondary',
  size = 'md',
  full = false,
  icon: Icon,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'ui-button',
    'ui-button-' + variant,
    'ui-button-' + size,
    full ? 'ui-button-full' : '',
    className,
  ].filter(Boolean).join(' ')

  return <button className={classes} {...props}>
    {Icon && <Icon className="ui-button-icon" aria-hidden="true" />}
    <span>{children}</span>
  </button>
}
