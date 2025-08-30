/**
 * Component Index - Central export point for all components
 * This file provides a single import point for all components
 */

// Enhanced Permoney Components
export {
  PermoneyCard,
  PermoneyCardHeader,
  PermoneyCardFooter,
  PermoneyCardTitle,
  PermoneyCardDescription,
  PermoneyCardContent,
} from './permoney-card';
export { PermoneyButton } from './permoney-button';
export { PermoneyInput } from './permoney-input';
export { PermoneyLogo, PermoneyLogoCompact } from './permoney-logo';

// Utility Components
export { CustomCursor } from './custom-cursor';
export { ThemeProvider } from './theme-provider';
export { default as ProtectedRoute } from './protected-route';

// Layout Components
export { Navbar } from './navbar';
export { DashboardNavbar } from './dashboard-navbar';
export { Sidebar as PermoneySidebar, MobileSidebar } from './sidebar';
export {
  DashboardLayout,
  DashboardPage,
  DashboardGrid,
  DashboardSection,
} from './dashboard-layout';
export { Footer } from './footer';

// Landing Page Sections
export { HeroSection } from './hero-section';
export { FeaturesSection } from './features-section';
export { HowItWorks } from './how-it-works';
export { SupportSection } from './support-section';

// Interactive Charts
export {
  LineChart,
  BarChart,
  DonutChart,
  SankeyChart,
  HeatmapChart,
  ChartContainer as PermoneyChartContainer,
} from './charts';

// Dashboard Components
export { AnalyticsOverview } from './dashboard';

// Islamic Finance Components
export { ZakatCalculator } from './islamic-finance';

// Subscription Management
export { SubscriptionManager } from './subscriptions';

// Demo Components
export { FormsDemo } from './forms-demo';
export { SidebarDemo } from './sidebar-demo';

// Export Data Import components
export { DataImportDemo, DataImportWizard } from './data-import';
export { DataImportTest } from './data-import-test';

// Forms Components
export {
  MultiStepWizard,
  FormStep,
  StepIndicator,
  FormProgress,
  TransactionForm,
  TransactionTypeStep,
  BasicInfoStep,
  AdditionalDetailsStep,
  ReviewStep,
  useFormWizard,
  useFormValidation,
  useFieldValidation,
  useAsyncValidation,
} from './forms';
export type {
  FormStepProps,
  WizardStep,
  FormWizardState,
  FormWizardAction,
  TransactionFormData,
  MultiStepWizardProps,
  FormValidationReturn,
} from './forms';

// UI Components (shadcn/ui)
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
export { Alert, AlertDescription, AlertTitle } from './ui/alert';
export { AspectRatio } from './ui/aspect-ratio';
export { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
export { Badge, badgeVariants } from './ui/badge';
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
export { Button, buttonVariants } from './ui/button';
export { Calendar } from './ui/calendar';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel';
export {
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from './ui/chart';
export { Checkbox } from './ui/checkbox';
export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command';
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ui/context-menu';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
export { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './ui/input-otp';
export { Input } from './ui/input';
export { Label } from './ui/label';
export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './ui/menubar';
export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from './ui/navigation-menu';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';
export { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
export { Progress } from './ui/progress';
export { RadioGroup, RadioGroupItem } from './ui/radio-group';
export {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './ui/resizable';
export { ScrollArea, ScrollBar } from './ui/scroll-area';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
export { Separator } from './ui/separator';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from './ui/sidebar';
export { Skeleton } from './ui/skeleton';
export { Slider } from './ui/slider';
export { Switch } from './ui/switch';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
export { Textarea } from './ui/textarea';
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './ui/toast';
export { Toaster } from './ui/toaster';
export { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
export { Toggle, toggleVariants } from './ui/toggle';
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

// Type exports
// Note: PermoneyCardProps is not exported from permoney-card.tsx
// If needed, it should be exported from the component file first

/**
 * Usage Examples:
 *
 * // Import multiple components
 * import { PermoneyCard, Button, Input } from '@/components'
 *
 * // Import specific UI components
 * import { Dialog, DialogContent, DialogTrigger } from '@/components'
 *
 * // Import layout components
 * import { Navbar, Footer } from '@/components'
 */
