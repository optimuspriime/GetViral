export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 40 40" width="23" height="23" fill="none">
        <path d="M5 18C5 10.82 10.82 5 18 5v13H5Z" fill="#B5E4BD" />
        <path d="M22 5c7.18 0 13 5.82 13 13H22V5Z" fill="#79C58A" />
        <path d="M5 22h13v13C10.82 35 5 29.18 5 22Z" fill="#4AA967" />
        <path d="M22 22h13c0 7.18-5.82 13-13 13V22Z" fill="#267C49" />
      </svg>
    </span>
  );
}
