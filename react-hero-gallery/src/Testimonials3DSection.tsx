import React, { useEffect, useRef, useState } from 'react';

// Editable testimonial data array
export const testimonials = [
  {
    id: 1,
    name: "Samir Mehta",
    role: "Founder · KXM Clothing",
    category: "Website & E-Commerce",
    quote: "Divyaraj delivered a lightning-fast headless storefront. His aesthetic judgment matched our streetwear brand perfectly."
  },
  {
    id: 2,
    name: "Ananya Iyer",
    role: "Creative Director · Abhushan Luxury",
    category: "Luxury Design",
    quote: "A rare engineer who has deep artistic sensibility. The custom layout transitions are incredibly smooth and refined."
  },
  {
    id: 3,
    name: "Rohan Shah",
    role: "Operations Head · DC Detailing",
    category: "Web Application",
    quote: "The interactive booking flows grew our conversions by 40%. Exceptionally clean and professional execution throughout."
  },
  {
    id: 4,
    name: "Vikram Malhotra",
    role: "Marketing VP · Apex Media",
    category: "Campaign Strategy",
    quote: "Strategic clarity, modern aesthetics, and execution under tight deadlines. Truly a top-tier digital partner."
  },
  {
    id: 5,
    name: "Elena Rostova",
    role: "Art Director · Kino Lab",
    category: "AI Filmmaking",
    quote: "Creative collaboration at its best. His technical setup for the AI cinematic project was absolutely flawless."
  },
  {
    id: 6,
    name: "Kabir Dev",
    role: "Product Manager · Stark Tech",
    category: "Web Engineering",
    quote: "He writes bulletproof code and understands micro-interactions. Our collaboration was extremely productive."
  },
  {
    id: 7,
    name: "Arjun Sen",
    role: "Co-Founder · Dither Digital",
    category: "Brand Strategy",
    quote: "He helped define our core branding and translated it into a beautiful, functional platform."
  },
  {
    id: 8,
    name: "Siddharth Rao",
    role: "Founder · Veloce Motors",
    category: "Automotive Portal",
    quote: "Understood our business needs immediately. The custom portal is fast, intuitive, and visually exceptional."
  },
  {
    id: 9,
    name: "Priya Nair",
    role: "Design Lead · Craft Agency",
    category: "User Experience",
    quote: "Brought outstanding technical skills and clean styling to our frontend application. A pleasure to work with."
  },
  {
    id: 10,
    name: "Marc Dupont",
    role: "Director · CineWorld",
    category: "AI Production",
    quote: "His visual eye and digital strategy made the campaign launch an enormous success in global markets."
  },
  {
    id: 11,
    name: "Nikhil Verma",
    role: "CTO · Elevate Labs",
    category: "Platform Architecture",
    quote: "High-performance code, great communication, and a strong understanding of web animations and rendering performance."
  },
  {
    id: 12,
    name: "Sarah Jenkins",
    role: "Creative Lead · Studio Nine",
    category: "Website Development",
    quote: "Divyaraj is a developer who truly respects design details. Every transition and hover state is crafted beautifully."
  }
];

export default function Testimonials3DSection() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const mouse = useRef({ x: 0, y: 0 });
  const current = useRef({ rx: 48, ry: -3, tx: 0, ty: 0 });

  useEffect(() => {
    // 1. Intersection Observer to detect visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    const section = document.getElementById('testimonials');
    if (section) {
      observer.observe(section);
    }

    // 2. Mouse Move handler for tilted board response
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return; // Disable pointer tilt on touch/mobile
      
      const rect = section?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const normalizedX = (x / rect.width) * 2 - 1; // -1 to 1
      const normalizedY = (y / rect.height) * 2 - 1; // -1 to 1

      mouse.current.x = normalizedX;
      mouse.current.y = normalizedY;
    };

    const handleMouseLeave = () => {
      mouse.current.x = 0;
      mouse.current.y = 0;
    };

    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
      section.addEventListener('mouseleave', handleMouseLeave);
    }

    // 3. requestAnimationFrame loop for smooth interpolation
    let rAFId: number;
    const baseRotateX = 48;
    const baseRotateY = -3;
    const baseRotateZ = -2;

    const tick = () => {
      if (!boardRef.current) {
        rAFId = requestAnimationFrame(tick);
        return;
      }

      // Calculate targets
      const targetRY = baseRotateY + mouse.current.x * 3.5;
      const targetRX = baseRotateX - mouse.current.y * 2.5;
      const targetTX = mouse.current.x * 12;
      const targetTY = mouse.current.y * 8;

      // Interpolate values
      current.current.rx += (targetRX - current.current.rx) * 0.06;
      current.current.ry += (targetRY - current.current.ry) * 0.06;
      current.current.tx += (targetTX - current.current.tx) * 0.06;
      current.current.ty += (targetTY - current.current.ty) * 0.06;

      // Apply CSS transform matrix to the board container
      boardRef.current.style.transform = `
        rotateX(${current.current.rx}deg) 
        rotateY(${current.current.ry}deg) 
        rotateZ(${baseRotateZ}deg) 
        translate3d(${current.current.tx}px, ${current.current.ty}px, 0)
        scale(0.94)
      `;

      rAFId = requestAnimationFrame(tick);
    };

    rAFId = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (section) {
        section.removeEventListener('mousemove', handleMouseMove);
        section.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(rAFId);
    };
  }, [isVisible]);

  // Toggle class on the outer section element to pause animations when off-screen
  useEffect(() => {
    const section = document.getElementById('testimonials');
    if (section) {
      if (isVisible) {
        section.classList.add('is-visible');
      } else {
        section.classList.remove('is-visible');
      }
    }
  }, [isVisible]);

  // Distribute data across 4 columns
  const col1 = [testimonials[0], testimonials[4], testimonials[8]];
  const col2 = [testimonials[1], testimonials[5], testimonials[9]];
  const col3 = [testimonials[2], testimonials[6], testimonials[10]];
  const col4 = [testimonials[3], testimonials[7], testimonials[11]];

  const columns = [col1, col2, col3, col4];

  return (
    <div className="testimonials-scene-inner" style={{ width: '100%', height: '100%' }}>
      <div ref={boardRef} className="testimonials-board">
        {columns.map((columnData, colIdx) => (
          <div key={colIdx} className="testimonial-column">
            <div className="testimonial-column-track">
              {/* Set 1 */}
              <div className="testimonial-set">
                {columnData.map((item) => (
                  <article key={item.id} className="testimonial-card">
                    <header className="testimonial-person">
                      <div className="testimonial-avatar">
                        <span className="testimonial-avatar-initial">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.role}</p>
                      </div>
                    </header>
                    <blockquote className="testimonial-card-quote">“{item.quote}”</blockquote>
                    <span className="testimonial-card-tag">{item.category}</span>
                  </article>
                ))}
              </div>
              {/* Set 2 (Seamless loop duplicate) */}
              <div className="testimonial-set" aria-hidden="true">
                {columnData.map((item) => (
                  <article key={`dup-${item.id}`} className="testimonial-card">
                    <header className="testimonial-person">
                      <div className="testimonial-avatar">
                        <span className="testimonial-avatar-initial">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.role}</p>
                      </div>
                    </header>
                    <blockquote className="testimonial-card-quote">“{item.quote}”</blockquote>
                    <span className="testimonial-card-tag">{item.category}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
