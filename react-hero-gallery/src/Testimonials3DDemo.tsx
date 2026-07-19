import React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

import {
  Card,
  CardContent,
} from '@/components/ui/card';

import {
  Marquee,
} from '@/components/ui/3d-testimonials';

const testimonials = [
  {
    name: 'Jayesh Thakker',
    username: '@jayesh_t',
    body: 'Brilliant strategy and perfect positioning! Working with Divyaraj was a complete game changer for our brand setup.',
    img: '',
    country: 'Mumbai',
    initial: 'J',
  },
  {
    name: 'Kartik Mistry',
    username: '@kartik_gt',
    body: 'Gujarat Tigers designs were absolutely spot on. Highly recommended digital strategist!',
    img: '',
    country: 'Gujarat',
    initial: 'K',
  },
  {
    name: 'Ravi Somani',
    username: '@ravi_finanvo',
    body: 'Finanvo branding identity looks extremely bold and clean. Simplest user flow and solid execution.',
    img: '',
    country: 'Noida',
    initial: 'S',
  },
  {
    name: 'Gaurang Shah',
    username: '@gaurang_whms',
    body: 'White Horse Media Solutions campaigns got incredible engagement. Visually striking assets delivered on time.',
    img: '',
    country: 'Delhi',
    initial: 'G',
  },
  {
    name: 'Ananya Sen',
    username: '@ananya_kxm',
    body: 'KXM Clothing streetwear campaign was a massive hit. The visual SMM strategy and assets got solid traction!',
    img: '',
    country: 'Mumbai',
    initial: 'A',
  },
  {
    name: 'Siddhant Siwach',
    username: '@siddhant_cr',
    body: 'Shift and Shelf platform assets are top level. Extremely clean visual interface styling.',
    img: '',
    country: 'Greater Noida',
    initial: 'S',
  },
  {
    name: 'Ujjwal Singh',
    username: '@ujjwal_cr',
    body: 'Brutalist portfolio designs for Credes and Scuff look very premium. Smooth project coordination.',
    img: '',
    country: 'Pune',
    initial: 'U',
  },
  {
    name: 'Raghubar Jha',
    username: '@raghubar_giffy',
    body: 'SMM output for Giffy launch was absolutely stellar. Amazing planned social media strategy!',
    img: '',
    country: 'Mumbai',
    initial: 'R',
  },
  {
    name: 'Ramkrishna Pamidimukkla',
    username: '@ram_aspire',
    body: 'Aspire positioning strategy was extremely structured. Perfect visual asset design!',
    img: '',
    country: 'Pune',
    initial: 'R',
  },
  {
    name: 'Abhishek Biswas',
    username: '@abhishek_sattvik',
    body: 'Sattvik certifications platform UI/UX is highly accessible and looks very clean.',
    img: '',
    country: 'Delhi',
    initial: 'A',
  },
  {
    name: 'Lokesh Suji',
    username: '@lokesh_esfi',
    body: 'ESFI esports tournament graphics got solid traction. Stark and impactful layouts.',
    img: '',
    country: 'Gujarat',
    initial: 'L',
  },
];

function TestimonialCard({
  img,
  name,
  username,
  body,
  country,
  initial,
}: (typeof testimonials)[number]) {
  return (
    <Card className="w-50 testimonial-card">
      <CardContent className="testimonial-card-content">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9 testimonial-avatar">
            {img ? (
              <AvatarImage
                src={img}
                alt={`${name} profile`}
                className="testimonial-avatar-image"
              />
            ) : null}

            <AvatarFallback className="testimonial-avatar-fallback">
              {initial || name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <figcaption className="flex items-center gap-1 text-sm font-medium testimonial-name">
              {name}

              <span className="text-xs testimonial-country">
                {country}
              </span>
            </figcaption>

            <p className="text-xs font-medium testimonial-username">
              {username}
            </p>
          </div>
        </div>

        <blockquote className="mt-3 text-sm testimonial-body">
          {body}
        </blockquote>
      </CardContent>
    </Card>
  );
}

export default function Testimonials3DDemo() {
  return (
    <div className="relative flex h-[640px] w-full max-w-none flex-row items-center justify-center gap-1.5 overflow-hidden rounded-lg [perspective:800px]">
      <div
        className="relative flex flex-row items-center gap-8"
        style={{
          transform:
            'translateX(-80px) translateY(0px) translateZ(-220px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <Marquee
          vertical
          pauseOnHover
          repeat={3}
          className="[--duration:40s]"
        >
          {testimonials.map((review) => (
            <TestimonialCard
              key={`column-1-${review.username}`}
              {...review}
            />
          ))}
        </Marquee>

        <Marquee
          vertical
          reverse
          pauseOnHover
          repeat={3}
          className="[--duration:40s]"
        >
          {testimonials.map((review) => (
            <TestimonialCard
              key={`column-2-${review.username}`}
              {...review}
            />
          ))}
        </Marquee>

        <Marquee
          vertical
          pauseOnHover
          repeat={3}
          className="[--duration:40s]"
        >
          {testimonials.map((review) => (
            <TestimonialCard
              key={`column-3-${review.username}`}
              {...review}
            />
          ))}
        </Marquee>

        <Marquee
          vertical
          reverse
          pauseOnHover
          repeat={3}
          className="[--duration:40s]"
        >
          {testimonials.map((review) => (
            <TestimonialCard
              key={`column-4-${review.username}`}
              {...review}
            />
          ))}
        </Marquee>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[12%] testimonial-fade-top" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[12%] testimonial-fade-bottom" />

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[12%] testimonial-fade-left" />

        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[12%] testimonial-fade-right" />
      </div>
    </div>
  );
}
