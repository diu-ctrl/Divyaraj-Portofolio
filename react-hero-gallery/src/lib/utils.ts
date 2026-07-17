export function cn(...classes: any[]) {
  return classes.filter(Boolean).map(c => String(c).trim()).join(' ');
}
