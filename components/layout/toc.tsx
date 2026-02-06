"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<string>("");
  const isClickingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickedHeadingRef = useRef<string>("");

  // Handle click on TOC item
  const handleClick = useCallback((e: React.MouseEvent, headingId: string) => {
    e.preventDefault();
    
    // Store the clicked heading
    clickedHeadingRef.current = headingId;
    
    // Set clicking state to prevent observer from overriding
    isClickingRef.current = true;
    
    // Clear any existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    // Update active state immediately - this is critical for visual feedback
    setActiveId(headingId);
    
    // Update URL hash without triggering scroll
    const url = new URL(window.location.href);
    url.hash = headingId;
    window.history.pushState(null, "", url.toString());
    
    // Scroll to element with offset for header
    const element = document.getElementById(headingId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    
    // Keep observer disabled longer to ensure click state persists
    // Only re-enable when scroll is complete and element is in view
    clickTimeoutRef.current = setTimeout(() => {
      // Double check the clicked element is still the active one
      if (clickedHeadingRef.current === headingId) {
        const element = document.getElementById(headingId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Only allow observer if element is properly positioned
          if (rect.top >= 80 && rect.top <= 200) {
            isClickingRef.current = false;
            clickedHeadingRef.current = "";
          } else {
            // Extend timeout if not in correct position
            clickTimeoutRef.current = setTimeout(() => {
              isClickingRef.current = false;
              clickedHeadingRef.current = "";
            }, 1000);
          }
        } else {
          isClickingRef.current = false;
          clickedHeadingRef.current = "";
        }
      } else {
        isClickingRef.current = false;
        clickedHeadingRef.current = "";
      }
    }, 1500);
  }, []);

  // Function to find the active heading based on scroll position
  const findActiveHeading = useCallback(() => {
    // Don't update if user just clicked a link
    if (isClickingRef.current) return;
    
    // Never override a clicked heading
    if (clickedHeadingRef.current) {
      const clickedElement = document.getElementById(clickedHeadingRef.current);
      if (clickedElement) {
        const rect = clickedElement.getBoundingClientRect();
        // Only allow override if clicked element is far from viewport
        if (rect.top > -100 && rect.top < 300) {
          return;
        }
      }
    }

    const scrollPosition = window.scrollY + 150; // Offset for header
    let activeHeading = "";
    let maxTop = -Infinity;

    // Find the heading that is currently in view or just passed
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = window.scrollY + rect.top;

        // Check if this heading is above the scroll position and closer than previous
        if (elementTop <= scrollPosition && elementTop > maxTop) {
          maxTop = elementTop;
          activeHeading = heading.id;
        }
      }
    });

    // If no heading found above scroll position, use the first heading
    if (!activeHeading && headings.length > 0) {
      activeHeading = headings[0].id;
    }

    // Update active ID if it changed and it's not the clicked heading
    if (activeHeading && activeHeading !== clickedHeadingRef.current) {
      setActiveId(activeHeading);
    }
  }, [headings]);

  useEffect(() => {
    // Set initial active from URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveId(hash);
    } else {
      // Set initial active heading based on scroll position
      setTimeout(findActiveHeading, 100);
    }

    // Handle browser back/forward navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveId(hash);
        isClickingRef.current = true;
        setTimeout(() => {
          isClickingRef.current = false;
        }, 500);
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    // Scroll event listener for better tracking
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          findActiveHeading();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // IntersectionObserver as backup/refinement
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update if user just clicked a link
        if (isClickingRef.current) return;
        
        // Never override a clicked heading
        if (clickedHeadingRef.current) {
          const clickedElement = document.getElementById(clickedHeadingRef.current);
          if (clickedElement) {
            const rect = clickedElement.getBoundingClientRect();
            // Only allow override if clicked element is far from viewport
            if (rect.top > -100 && rect.top < 300) {
              return;
            }
          }
        }
        
        // Find all intersecting entries
        const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
        
        if (intersectingEntries.length === 0) {
          // If nothing is intersecting, use scroll-based detection
          findActiveHeading();
          return;
        }
        
        // Sort by position - get the one closest to the top of viewport
        const sortedEntries = intersectingEntries.sort((a, b) => {
          const aTop = a.boundingClientRect.top;
          const bTop = b.boundingClientRect.top;
          return aTop - bTop;
        });
        
        // Get the first intersecting heading that's near the top
        const topEntry = sortedEntries.find(entry => entry.boundingClientRect.top >= 100);
        const activeEntry = topEntry || sortedEntries[0];
        
        if (activeEntry && activeEntry.boundingClientRect.top < 200) {
          // Don't override clicked heading
          if (activeEntry.target.id !== clickedHeadingRef.current) {
            setActiveId(activeEntry.target.id);
          }
        }
      },
      {
        rootMargin: "-100px 0% -70% 0%",
        threshold: [0, 0.1, 0.5, 1.0],
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("scroll", handleScroll);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings, findActiveHeading]);

  if (headings.length === 0) {
    return null;
  }

  // Filter to only show h2 and h3
  const filteredHeadings = headings.filter(
    (heading) => heading.level >= 2 && heading.level <= 3
  );

  if (filteredHeadings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-20 pl-4 border-l border-border">
        <p className="text-sm font-medium mb-4">{t("onThisPage")}</p>
        <nav className="space-y-1">
          {filteredHeadings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "block text-sm py-2 px-2 -mx-2 rounded-md transition-all relative cursor-pointer",
                heading.level === 3 && "pl-6",
                activeId === heading.id
                  ? "text-primary font-semibold bg-primary/15 shadow-sm before:absolute before:left-[-17px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-6 before:bg-primary before:rounded-full"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-current={activeId === heading.id ? "page" : undefined}
              onClick={(e) => handleClick(e, heading.id)}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
