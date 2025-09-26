"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

interface CarouselContextValue extends CarouselProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ orientation = "horizontal", className, children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const updateScrollState = React.useCallback(() => {
      const el = containerRef.current
      if (!el) return

      if (orientation === "horizontal") {
        setCanScrollPrev(el.scrollLeft > 0)
        setCanScrollNext(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth)
      } else {
        setCanScrollPrev(el.scrollTop > 0)
        setCanScrollNext(Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight)
      }
    }, [orientation])

    const scrollBy = React.useCallback(
      (direction: 1 | -1) => {
        const el = containerRef.current
        if (!el) return

        const distance = orientation === "horizontal" ? el.clientWidth : el.clientHeight
        if (orientation === "horizontal") {
          el.scrollBy({ left: distance * direction, behavior: "smooth" })
        } else {
          el.scrollBy({ top: distance * direction, behavior: "smooth" })
        }
      },
      [orientation]
    )

    const scrollPrev = React.useCallback(() => scrollBy(-1), [scrollBy])
    const scrollNext = React.useCallback(() => scrollBy(1), [scrollBy])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft" && orientation === "horizontal") {
          event.preventDefault()
          scrollPrev()
        }
        if (event.key === "ArrowRight" && orientation === "horizontal") {
          event.preventDefault()
          scrollNext()
        }
        if (event.key === "ArrowUp" && orientation === "vertical") {
          event.preventDefault()
          scrollPrev()
        }
        if (event.key === "ArrowDown" && orientation === "vertical") {
          event.preventDefault()
          scrollNext()
        }
      },
      [orientation, scrollNext, scrollPrev]
    )

    React.useEffect(() => {
      updateScrollState()
    }, [children, updateScrollState])

    React.useEffect(() => {
      const el = containerRef.current
      if (!el) return

      const handle = () => updateScrollState()
      el.addEventListener("scroll", handle, { passive: true })
      window.addEventListener("resize", handle)
      return () => {
        el.removeEventListener("scroll", handle)
        window.removeEventListener("resize", handle)
      }
    }, [updateScrollState])

    return (
      <CarouselContext.Provider
        value={{
          containerRef,
          orientation,
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          className={cn("relative", className)}
          onKeyDownCapture={handleKeyDown}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { containerRef, orientation } = useCarousel()

    return (
      <div ref={containerRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            "flex snap-mandatory gap-4",
            orientation === "horizontal"
              ? "-ml-4 snap-x"
              : "-mt-4 flex-col snap-y",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel()

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full snap-center",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className
        )}
        {...props}
      />
    )
  }
)
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
