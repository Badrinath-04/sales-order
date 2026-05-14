export default function Avatar({ src, alt = '', sizeClassName = 'h-10 w-10', className = '' }) {
  return <img alt={alt} src={src} className={`rounded-full object-cover ${sizeClassName} ${className}`} />
}
