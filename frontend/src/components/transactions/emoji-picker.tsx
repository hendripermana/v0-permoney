'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

// Comprehensive emoji categories
const EMOJI_CATEGORIES = {
  'Food & Dining': [
    '🍽️', '🍔', '🍕', '🍝', '🍜', '🍱', '🍙', '🍘', '🍚', '🍛',
    '🍤', '🍣', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂',
    '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵',
    '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹',
    '🛒', '🥘', '🥗', '🥙', '🌮', '🌯', '🥪', '🍖', '🍗', '🥓'
  ],
  'Transportation': [
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🚁',
    '✈️', '🛫', '🛬', '🚀', '🛸', '🚢', '⛵', '🚤', '🛥️', '⛽',
    '🅿️', '🚏', '🚇', '🚊', '🚝', '🚞', '🚋', '🚃', '🚂', '🚄'
  ],
  'Shopping': [
    '🛍️', '🛒', '🏪', '🏬', '🏢', '🏭', '🏗️', '🏘️', '🏚️', '🏠',
    '👕', '👔', '👗', '👘', '👙', '👚', '👛', '👜', '👝', '🎒',
    '👞', '👟', '👠', '👡', '👢', '👑', '👒', '🎩', '🧢', '⛑️',
    '📱', '💻', '⌨️', '🖥️', '🖨️', '📷', '📹', '📼', '💿', '💾'
  ],
  'Entertainment': [
    '🎬', '🎭', '🎪', '🎨', '🎰', '🎲', '🎯', '🎳', '🎮', '🕹️',
    '🎵', '🎶', '🎤', '🎧', '📻', '🎸', '🎹', '🥁', '🎺', '🎷',
    '🎻', '🪕', '🎪', '🎨', '🖼️', '🎭', '🎪', '🎡', '🎢', '🎠',
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱'
  ],
  'Health & Fitness': [
    '🏥', '⚕️', '🩺', '💊', '💉', '🌡️', '🧬', '🦠', '🧪', '🔬',
    '💪', '🏃‍♂️', '🏃‍♀️', '🚴‍♂️', '🚴‍♀️', '🏊‍♂️', '🏊‍♀️', '🧘‍♂️', '🧘‍♀️', '🤸‍♂️',
    '🤸‍♀️', '🏋️‍♂️', '🏋️‍♀️', '🤾‍♂️', '🤾‍♀️', '🏌️‍♂️', '🏌️‍♀️', '🏇', '🧗‍♂️', '🧗‍♀️',
    '🦷', '👨‍⚕️', '👩‍⚕️', '🧴', '🧼', '🧽', '🧻', '🩹', '🩺', '💊'
  ],
  'Money & Finance': [
    '💰', '💵', '💴', '💶', '💷', '💸', '💳', '💎', '⚖️', '💼',
    '📈', '📉', '📊', '🏦', '🏧', '💹', '💱', '💲', '🪙', '🏛️',
    '📋', '📄', '📃', '📑', '📊', '📈', '📉', '💹', '💰', '💵'
  ],
  'Home & Utilities': [
    '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏪', '🏫',
    '💡', '🔌', '🔋', '🕯️', '💧', '🚿', '🛁', '🚽', '🧻', '🧼',
    '🌐', '📞', '📱', '☎️', '📠', '📺', '📻', '🔊', '🔇', '🔈',
    '🛡️', '🔒', '🔓', '🔑', '🗝️', '🔐', '🛠️', '🔧', '🔨', '⚒️'
  ],
  'Travel & Places': [
    '🧳', '🎒', '👜', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯',
    '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲',
    '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺',
    '🏞️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🌅', '🌄'
  ],
  'Education & Work': [
    '🎓', '📚', '📖', '📝', '✏️', '✒️', '🖊️', '🖋️', '🖌️', '🖍️',
    '📄', '📃', '📑', '📊', '📈', '📉', '🗂️', '📂', '📁', '📋',
    '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️',
    '💼', '👔', '👗', '👘', '🥼', '🦺', '👷‍♂️', '👷‍♀️', '👨‍💼', '👩‍💼'
  ],
  'Gifts & Special': [
    '🎁', '🎀', '🎊', '🎉', '🎈', '🎂', '🍰', '🧁', '🎪', '🎭',
    '❤️', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔',
    '🤝', '👏', '🙏', '💐', '🌹', '🌺', '🌻', '🌷', '🌸', '💮'
  ]
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  selectedEmoji?: string;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, selectedEmoji, className }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Food & Dining');

  const filteredEmojis = searchTerm
    ? Object.values(EMOJI_CATEGORIES).flat().filter(emoji => 
        // Simple search - could be enhanced with emoji names/descriptions
        emoji.includes(searchTerm)
      )
    : EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('w-10 h-10 p-0', className)}
        >
          {selectedEmoji || <Smile className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        
        {!searchTerm && (
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'ghost'}
                size="sm"
                className="text-xs h-7"
                onClick={() => setSelectedCategory(category)}
              >
                {category.split(' ')[0]}
              </Button>
            ))}
          </div>
        )}
        
        <ScrollArea className="h-48">
          <div className="grid grid-cols-8 gap-1 p-2">
            {filteredEmojis.map((emoji, index) => (
              <Button
                key={`${emoji}-${index}`}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 text-lg hover:bg-accent"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        {filteredEmojis.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No emojis found
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
