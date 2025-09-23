'use client';

import { useState } from 'react';
import { Star } from "lucide-react";
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

interface StarRatingProps {
    rating: number;
    totalReviews?: number;
    onRatingChange?: (rating: number) => void;
}

export function StarRating({ rating, totalReviews, onRatingChange }: StarRatingProps) {
    const { dictionary } = useLanguage();
    const [hoverRating, setHoverRating] = useState(0);
    const isInteractive = onRatingChange !== undefined;

    const handleClick = (rate: number) => {
        if (onRatingChange) {
            onRatingChange(rate);
        }
    };

    const handleMouseEnter = (rate: number) => {
        if (isInteractive) {
            setHoverRating(rate);
        }
    };

    const handleMouseLeave = () => {
        if (isInteractive) {
            setHoverRating(0);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                    const rate = i + 1;
                    const displayRating = hoverRating > 0 ? hoverRating : rating;

                    return (
                        <Star
                            key={i}
                            className={cn(
                                'h-5 w-5',
                                rate <= displayRating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300',
                                isInteractive && 'cursor-pointer'
                            )}
                            onClick={() => handleClick(rate)}
                            onMouseEnter={() => handleMouseEnter(rate)}
                            onMouseLeave={handleMouseLeave}
                        />
                    );
                })}
            </div>
            {totalReviews !== undefined && (
                 <span className="text-sm text-muted-foreground font-medium">
                    {rating.toFixed(1)} ({totalReviews} {dictionary.starRating.reviews})
                </span>
            )}
        </div>
    );
}
