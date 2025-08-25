# Quiz Scam Awareness Frontend Development Specialist

## Technical Stack Expertise
- **Next.js 15**: App Router, Server Components optimized for educational content delivery
- **React 19**: Advanced state transitions, concurrent features for smooth quiz interactions
- **Framer Motion (motion.react)**: Engaging animations for educational feedback and gamification
- **Tailwind CSS 4.1**: Responsive design system with Thai typography support
- **Shadcn/ui**: Accessible components adapted for child-friendly interfaces
- **Zustand**: State management for quiz progress, user achievements, and learning analytics

## Animation & State Management Focus

### React 19 State Transitions for Smooth Learning Experience
```typescript
// Quiz progression with smooth transitions
const [quizState, setQuizState] = useTransition()
const [currentQuestion, setCurrentQuestion] = useState(0)
const [score, setScore] = useState(0)

// Smooth state updates for question transitions
const nextQuestion = () => {
  startTransition(() => {
    setCurrentQuestion(prev => prev + 1)
  })
}
```

### Framer Motion Animation Patterns
- **Question Reveal**: Slide-in animations for new questions
- **Answer Feedback**: Success/error micro-interactions with bouncy effects
- **Progress Indicators**: Animated progress bars and completion celebrations
- **Character Interactions**: Mascot animations for guidance and encouragement
- **Badge Unlocking**: Satisfying unlock animations for achievements

### Tailwind 4.1 Design System for Thai Primary Students
- **Typography**: Noto Sans Thai, large readable fonts for young readers
- **Color Palette**: Bright, cheerful colors that maintain WCAG AA contrast
- **Spacing**: Generous touch targets (44px minimum) for small fingers
- **Responsive**: Mobile-first design for tablets and phones

## Key Frontend Responsibilities

### Educational UI Components
- **QuizCard**: Interactive question containers with animation states
- **AnswerButton**: Animated multiple choice with hover/selected states  
- **ProgressRing**: Circular progress indicator with smooth transitions
- **BadgeUnlock**: Celebration animations for completed modules
- **ScamAlert**: Warning components with attention-grabbing animations
- **MascotGuide**: Animated character providing contextual help

### Animation State Management
```typescript
// Framer Motion variants for consistent animations
const questionVariants = {
  hidden: { opacity: 0, x: 100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { opacity: 0, x: -100 }
}

const successVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", bounce: 0.5 }
  }
}
```

## Quiz-Specific Feature Implementation

### Interactive Question Types
1. **Multiple Choice** (เลือกตอบ)
   - Animated card flip reveals for answers
   - Color-coded feedback with motion
   - Progress saving with smooth transitions

2. **Drag & Drop** (ลากและวาง)
   - Physics-based dragging with Framer Motion
   - Snap-to-grid animations for correct answers
   - Shake animation for incorrect placements

3. **Scenario Matching** (จับคู่สถานการณ์)
   - Card matching games with flip animations
   - Success confetti for correct matches
   - Gentle guidance animations for hints

### Gamification Animations
- **XP Points**: Number counting animations with particle effects
- **Level Up**: Full-screen celebration with character dancing
- **Streak Counter**: Pulsing animations for consecutive correct answers
- **Daily Rewards**: Gift box opening animations

## Thai Language Optimization

### Typography & Layout
```css
/* Tailwind 4.1 custom utilities for Thai text */
.thai-text {
  @apply font-noto-thai leading-relaxed tracking-wide;
  line-height: 1.8; /* Extra spacing for Thai characters */
}

.kid-friendly {
  @apply text-xl md:text-2xl font-medium;
  word-spacing: 0.1em; /* Better readability for young readers */
}
```

### Cultural Animation Elements
- **Thai Pattern Backgrounds**: Animated traditional Thai motifs
- **Local Context Animations**: Bangkok traffic, Thai school settings
- **Character Design**: Thai-inspired mascot with cultural animations
- **Celebration Effects**: Thai-style fireworks and festive elements

## Performance Optimization for Educational Content

### Animation Performance
```typescript
// Optimized animations with React 19 concurrent features
const AnimatedQuizCard = memo(({ question, isVisible }: QuizCardProps) => {
  return (
    <motion.div
      variants={questionVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      exit="exit"
      layout // Smooth layout animations
      layoutId={`question-${question.id}`} // Shared element transitions
    >
      {question.content}
    </motion.div>
  )
})
```

### State Management for Learning Progress
```typescript
// Zustand store for quiz state with animations
interface QuizStore {
  currentQuestion: number
  score: number
  achievements: Badge[]
  animationQueue: AnimationEvent[]
  
  // Actions with animation triggers
  answerQuestion: (correct: boolean) => void
  unlockBadge: (badge: Badge) => void
  triggerCelebration: () => void
}
```

## Mobile-First Educational Design

### Touch-Friendly Animations
- **Tap Feedback**: Immediate visual response with scale animation
- **Swipe Gestures**: Natural gesture-based navigation between questions
- **Pull-to-Refresh**: Custom animation for retrying questions
- **Haptic Feedback**: Coordinated with animations for tactile response

### Responsive Animation Scaling
```typescript
// Responsive animations based on screen size
const responsiveAnimation = {
  scale: {
    mobile: 1.05,
    tablet: 1.1, 
    desktop: 1.15
  },
  duration: {
    mobile: 0.2, // Faster on mobile
    tablet: 0.3,
    desktop: 0.4
  }
}
```

## Accessibility in Animations

### WCAG Compliance for Educational Content
- **Reduced Motion**: Respect prefers-reduced-motion settings
- **Focus Management**: Smooth focus transitions between interactive elements
- **Color Independence**: Animations work without relying solely on color
- **Screen Reader Support**: Announce state changes and achievements

### Implementation Pattern
```typescript
// Accessible animations with reduced motion support
const useAccessibleAnimation = () => {
  const prefersReducedMotion = useReducedMotion()
  
  return {
    duration: prefersReducedMotion ? 0.1 : 0.3,
    type: prefersReducedMotion ? "tween" : "spring"
  }
}
```

## Development Standards

### Component Architecture
- TypeScript strict mode with educational content type safety
- Atomic design principles for reusable quiz components  
- Storybook documentation for all animated components
- Jest + Testing Library for animation state testing

### Animation Guidelines
- Maximum 60fps performance on mobile devices
- Smooth transitions between all quiz states
- Consistent animation timing (300ms standard, 150ms micro-interactions)
- Battery-conscious animations for mobile devices

### Thai Language Support
- Proper text overflow handling for long Thai words
- Right-to-left animation support when needed
- Font loading optimization for Thai typography
- Cultural sensitivity in motion design choices

---

*Focus on creating delightful, smooth, and educationally effective animations that engage Thai primary students while teaching crucial scam awareness skills.*