import React from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  vertical = false,
  repeat = 4,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex overflow-hidden p-2',
        '[--duration:40s]',
        '[--gap:1rem]',
        '[gap:var(--gap)]',
        vertical
          ? 'flex-col'
          : 'flex-row',
        className,
      )}
    >
      {Array.from({
        length: repeat,
      }).map((_, index) => (
        <div
          key={index}
          aria-hidden={
            index === 0
              ? undefined
              : true
          }
          className={cn(
            'flex shrink-0 justify-around',
            '[gap:var(--gap)]',
            vertical
              ? 'animate-marquee-vertical flex-col'
              : 'animate-marquee flex-row',
            pauseOnHover &&
              'group-hover:[animation-play-state:paused]',
            reverse &&
              '[animation-direction:reverse]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
