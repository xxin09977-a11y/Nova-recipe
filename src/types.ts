/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Instruction {
  step: number;
  text: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  hasCompletedOnboarding?: boolean;
  preferences: {
    darkMode: boolean;
    notifications: boolean;
    fontScale: number;
    debugMode: boolean;
    appTheme?: 'noir' | 'clay' | 'frost' | 'organic';
  };
}

export type Category = {
  id: string;
  name: string;
  icon: string;
};
