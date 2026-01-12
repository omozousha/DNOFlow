"use client";

// Quick Stats Interactive Cards Component - Modern Futuristic Design
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard/shared/summary-card";
import { getStatusConfig } from "@/lib/status-config";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface QuickStatsCardsProps {
  summaryData: DashboardCard[];
  selectedCard: string;
  onCardClick: (key: string) => void;
}

export function QuickStatsCards({ 
  summaryData, 
  selectedCard, 
  onCardClick 
}: QuickStatsCardsProps) {
  // Jika hanya 1 card, render tanpa grid wrapper
  const isSingleCard = summaryData.length === 1;
  
  return (
    <div className={cn(
      isSingleCard 
        ? "h-full" // Single card fills container
        : "grid grid-cols-12 gap-3 md:gap-4"
    )}>
      {summaryData.map((card, index) => {
        const isSelected = selectedCard === card.key;
        const statusConfig = getStatusConfig(card.key);
        
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.05,
              ease: "easeOut"
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              isSingleCard 
                ? "h-full" 
                : "col-span-12 xs:col-span-6 sm:col-span-4 lg:col-span-2"
            )}
          >
            <Card
              onClick={() => onCardClick(card.key)}
              className={cn(
                "group relative overflow-hidden cursor-pointer h-full max-h-[150px]",
                "transition-all duration-300 ease-in-out",
                "border backdrop-blur-sm",
                "z-10",
                isSelected 
                  ? cn(
                      "border-2 shadow-2xl",
                      statusConfig.borderColor,
                      "bg-gradient-to-br from-background via-background/95 to-background/90",
                      // Glow effect untuk selected card
                      "before:absolute before:inset-0 before:rounded-lg before:p-[2px]",
                      "before:bg-gradient-to-br before:from-primary/20 before:via-primary/10 before:to-transparent",
                      "before:-z-10 before:blur-xl before:transition-all before:duration-300"
                    )
                  : cn(
                      "border-border/50 hover:border-primary/30",
                      "bg-gradient-to-br from-card/80 via-card/90 to-card",
                      "hover:shadow-xl hover:bg-card/95"
                    )
              )}
            >
              {/* Animated gradient overlay pada hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                "bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
              )} />
              
              {/* Shimmer effect */}
              <div className={cn(
                "absolute -inset-full h-full w-1/2 z-5 block",
                "transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent",
                "opacity-0 group-hover:opacity-100",
                "group-hover:animate-[shimmer_1.5s_ease-in-out]"
              )} />

              <CardContent className={cn(
                "relative",
                isSingleCard 
                  ? "p-0.5 sm:p-0.5 md:p-1 h-full flex items-center justify-center" 
                  : "p-0.5 sm:p-0.5 md:p-1"
              )}>
                <div className={cn(
                  "flex flex-col items-center justify-center",
                  isSingleCard ? "gap-0 w-full" : "gap-0.5"
                )}>
                  {/* Header: Icon & Badge */}
                  <div className="flex items-center justify-center w-full">
                    {/* Icon Container with gradient */}
                    <div className={cn(
                      "relative rounded-lg",
                      isSingleCard ? "p-1.5 sm:p-2" : "p-1 sm:p-1.5",
                      "transition-all duration-300 group-hover:scale-110",
                      statusConfig.bgColor,
                      isSelected && "shadow-lg"
                    )}>
                      <div className={cn("relative z-10", isSingleCard ? "scale-[0.8]" : "scale-[0.7]")}>
                        {statusConfig.icon}
                      </div>
                      {/* Glow effect di icon saat selected */}
                      {isSelected && (
                        <div className={cn(
                          "absolute inset-0 rounded-sm blur-md opacity-50",
                          statusConfig.bgColor
                        )} />
                      )}
                    </div>

                    {/* Active Badge with animation */}
                    {isSelected && (
                      <motion.div
                        className="absolute top-1 right-1"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <Badge 
                          className={cn(
                            "text-xs h-5 px-1.5",
                            "bg-gradient-to-r from-primary to-primary/80",
                            "shadow-lg border-primary/20",
                            "flex items-center gap-0.5"
                          )}
                        >
                          <Zap className="h-2.5 w-2.5 fill-current" />
                          <span className="text-[10px]">Active</span>
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Stats Value dengan gradient text */}
                  <div className="space-y-0.5 text-center">
                    <motion.div 
                      className={cn(
                        "font-bold tabular-nums leading-tight",
                        isSingleCard 
                          ? "text-4xl sm:text-5xl md:text-5xl" 
                          : "text-3xl sm:text-4xl md:text-4xl",
                        "bg-gradient-to-br from-foreground via-foreground to-foreground/70",
                        "bg-clip-text text-transparent",
                        isSelected && "from-primary via-foreground to-primary/70"
                      )}
                      animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {card.value}
                    </motion.div>
                    
                    <p className={cn(
                      "font-medium",
                      isSingleCard 
                        ? "text-base sm:text-lg" 
                        : "text-xs sm:text-sm",
                      "text-muted-foreground/80 group-hover:text-muted-foreground",
                      "transition-colors duration-200 line-clamp-2",
                      isSelected && "text-foreground/90"
                    )}>
                      {card.title}
                    </p>
                  </div>
                  
                  {/* Ports Information Badge */}
                  {card.subLabel && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-medium text-sm h-6 py-1",
                        "justify-center border-dashed",
                        "transition-all duration-300",
                        isSelected 
                          ? cn(
                              statusConfig.textColor,
                              "border-current bg-current/5",
                              "shadow-sm"
                            )
                          : "border-border/70 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      {card.subLabel}
                    </Badge>
                  )}
                </div>

                {/* Bottom gradient line untuk selected card */}
                {isSelected && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-1",
                      "bg-gradient-to-r from-transparent via-primary to-transparent"
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
