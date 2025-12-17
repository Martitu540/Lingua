import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Flame, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    avatar: "/professional-woman-portrait.png",
    content:
      "I went from zero Spanish to having real conversations in just 3 months. The AI tutor feels like talking to a real person!",
    rating: 5,
    streak: 127,
  },
  {
    name: "Marcus Weber",
    role: "Marketing Manager",
    avatar: "/professional-man-portrait.png",
    content:
      "The gamification keeps me coming back every day. I've maintained a 90-day streak and learned more than I ever did in school.",
    rating: 5,
    streak: 90,
  },
  {
    name: "Yuki Tanaka",
    role: "Graduate Student",
    avatar: "/young-asian-woman-portrait.png",
    content:
      "Learning French while commuting has been a game-changer. The bite-sized lessons fit perfectly into my busy schedule.",
    rating: 5,
    streak: 45,
  },
]

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="border-t bg-muted/30 px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Testimonials
          </div>
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Loved by <span className="gradient-text">Millions</span> of Learners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Join a community of language enthusiasts achieving their goals.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative overflow-hidden rounded-2xl border-2 border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
            >
              {/* Decorative quote */}
              <Quote className="absolute -right-2 -top-2 h-20 w-20 rotate-12 text-primary/5" />

              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-xp text-xp" />
                ))}
              </div>

              {/* Content */}
              <p className="relative mt-4 text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>

              {/* Author */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-streak/15 px-3 py-1.5 text-sm font-bold text-streak">
                  <Flame className="h-4 w-4" />
                  {testimonial.streak}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
