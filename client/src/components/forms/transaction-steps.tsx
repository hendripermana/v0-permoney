/**
 * Transaction Form Step Components
 * Individual step components for the transaction form wizard
 */

import React, { useState } from 'react';
import { FormStep } from './form-step';
import { FormStepComponentProps } from './types';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  RadioGroup,
  RadioGroupItem,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
  PermoneyCard,
} from '../index';
import { CalendarIcon, DollarSign, Tag, Camera, MapPin } from 'lucide-react';
import { format } from 'date-fns';

// Mock data for categories
const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
];

const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Other',
];

// Transaction Type Step
export function TransactionTypeStep({
  data,
  onChange,
}: FormStepComponentProps) {
  return (
    <FormStep
      title="What type of transaction is this?"
      description="Select whether you're recording an expense or income"
    >
      <RadioGroup
        value={data.type}
        onValueChange={value => onChange({ type: value })}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
          <RadioGroupItem value="expense" id="expense" />
          <Label
            htmlFor="expense"
            className="flex items-center gap-2 cursor-pointer"
          >
            <DollarSign className="h-4 w-4 text-red-500" />
            Expense
          </Label>
        </div>
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
          <RadioGroupItem value="income" id="income" />
          <Label
            htmlFor="income"
            className="flex items-center gap-2 cursor-pointer"
          >
            <DollarSign className="h-4 w-4 text-green-500" />
            Income
          </Label>
        </div>
      </RadioGroup>
    </FormStep>
  );
}

// Basic Information Step
export function BasicInfoStep({ data, onChange }: FormStepComponentProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    data.date || new Date()
  );
  const transactionType = data.type;
  const categories =
    transactionType === 'income' ? incomeCategories : expenseCategories;

  return (
    <FormStep
      title="Enter transaction details"
      description="Provide the basic information about your transaction"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={data.amount || ''}
            onChange={e => {
              const amount = parseFloat(e.target.value) || 0;
              onChange({ ...data, amount });
            }}
            className="text-lg"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="What was this transaction for?"
            value={data.description || ''}
            onChange={e => {
              onChange({ ...data, description: e.target.value });
            }}
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={data.category || ''}
            onValueChange={value => {
              onChange({ ...data, category: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => {
                  if (date) {
                    setSelectedDate(date);
                    onChange({ ...data, date });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </FormStep>
  );
}

// Additional Details Step
export function AdditionalDetailsStep({
  data,
  onChange,
}: FormStepComponentProps) {
  const [tags, setTags] = useState<string[]>(data.tags || []);
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      onChange({ ...data, tags: updatedTags });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag: string) => tag !== tagToRemove);
    setTags(updatedTags);
    onChange({ ...data, tags: updatedTags });
  };

  return (
    <FormStep
      title="Additional details (optional)"
      description="Add extra information to help track your spending"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes about this transaction..."
            value={data.notes || ''}
            onChange={e => {
              onChange({ ...data, notes: e.target.value });
            }}
            rows={3}
          />
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" onClick={addTag} size="sm">
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <div className="flex gap-2">
            <MapPin className="h-4 w-4 mt-3 text-muted-foreground" />
            <Input
              id="location"
              placeholder="Where did this transaction occur?"
              value={data.location || ''}
              onChange={e => {
                onChange({ ...data, location: e.target.value });
              }}
            />
          </div>
        </div>

        <div>
          <Label>Receipt</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload receipt (optional)
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>
      </div>
    </FormStep>
  );
}

// Review Step
export function ReviewStep({ data }: FormStepComponentProps) {
  return (
    <FormStep
      title="Review your transaction"
      description="Please review the details before saving"
    >
      <PermoneyCard className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Type:</span>
            <Badge
              variant={data.type === 'expense' ? 'destructive' : 'default'}
            >
              {data.type === 'expense' ? 'Expense' : 'Income'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Amount:</span>
            <span
              className={`text-lg font-bold ${
                data.type === 'expense' ? 'text-red-600' : 'text-green-600'
              }`}
            >
              ${data.amount?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Description:</span>
            <span>{data.description}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Category:</span>
            <span>{data.category}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Date:</span>
            <span>{data.date ? format(data.date, 'PPP') : 'Not set'}</span>
          </div>
          {data.notes && (
            <div className="flex justify-between items-start">
              <span className="font-medium">Notes:</span>
              <span className="text-right max-w-xs">{data.notes}</span>
            </div>
          )}
          {data.tags && data.tags.length > 0 && (
            <div className="flex justify-between items-start">
              <span className="font-medium">Tags:</span>
              <div className="flex flex-wrap gap-1 max-w-xs">
                {data.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {data.location && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Location:</span>
              <span>{data.location}</span>
            </div>
          )}
        </div>
      </PermoneyCard>

      <div className="flex items-center space-x-2 mt-4">
        <input
          type="checkbox"
          id="confirm"
          checked={data.confirmed || false}
          onChange={e => {
            // This will be handled by the parent component
          }}
        />
        <Label htmlFor="confirm">
          I confirm that the above information is correct
        </Label>
      </div>
    </FormStep>
  );
}
