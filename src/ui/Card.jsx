export default function Card({
  as: Component = 'div',
  interactive = false,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'ui-card',
    interactive ? 'ui-card-interactive' : '',
    className,
  ].filter(Boolean).join(' ')

  return <Component className={classes} {...props}>
    {children}
  </Component>
}
