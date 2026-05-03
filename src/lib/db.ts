/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';
import { Recipe, UserProfile } from '../types';

export class KitchenOSDatabase extends Dexie {
  recipes!: Table<Recipe>;
  userProfile!: Table<UserProfile>;

  constructor() {
    super('KitchenOS-DB');
    this.version(1).stores({
      recipes: '++id, title, category, isFavorite, difficulty', // Primary key and indexed fields
      userProfile: 'id'
    });
  }
}

export const db = new KitchenOSDatabase();

// Initial seed data function if database is empty
export async function seedDatabase() {
  const count = await db.recipes.count();
  if (count === 0) {
    const MOCK_RECIPES: Recipe[] = [
      {
        id: '1',
        title: 'Autumn Harvest Bowl',
        description: 'A vibrant mix of seasonal veggies and grains.',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1000',
        prepTime: 15,
        cookTime: 20,
        servings: 2,
        difficulty: 'Easy',
        category: 'Healthy',
        ingredients: [
          { id: 'i1', name: 'Quinoa', amount: 1, unit: 'cup' },
          { id: 'i2', name: 'Sweet Potato', amount: 1, unit: 'large' }
        ],
        instructions: [
          { step: 1, text: 'Roast the veggies.' },
          { step: 2, text: 'Cook the quinoa.' }
        ],
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Midnight Ramen',
        description: 'Authentic tonkotsu broth with perfectly soft-boiled eggs.',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=1000',
        prepTime: 30,
        cookTime: 60,
        servings: 1,
        difficulty: 'Hard',
        category: 'Japanese',
        ingredients: [
          { id: 'r1', name: 'Ramen Noodles', amount: 1, unit: 'pack' },
          { id: 'r2', name: 'Miso Broth', amount: 500, unit: 'ml' },
          { id: 'r3', name: 'Soft Boiled Egg', amount: 1, unit: 'piece' },
        ],
        instructions: [
          { step: 1, text: 'Prepare the broth with aromatics.' },
          { step: 2, text: 'Boil noodles until al-dente.' },
          { step: 3, text: 'Assemble with toppings and serve hot.' },
        ],
        isFavorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Truffle Pasta',
        description: 'Wild mushroom and black truffle cream sauce.',
        image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=1000',
        prepTime: 10,
        cookTime: 15,
        servings: 4,
        difficulty: 'Medium',
        category: 'Italian',
        ingredients: [
          { id: 'p1', name: 'Spaghetti', amount: 400, unit: 'g' },
          { id: 'p2', name: 'Heavy Cream', amount: 200, unit: 'ml' },
          { id: 'p3', name: 'Truffle Oil', amount: 2, unit: 'tbsp' },
        ],
        instructions: [
          { step: 1, text: 'Boil pasta in salted water.' },
          { step: 2, text: 'Simmer cream and truffle oil.' },
          { step: 3, text: 'Toss pasta in sauce until coated.' },
        ],
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
    await db.recipes.bulkAdd(MOCK_RECIPES);
  }

  const profileCount = await db.userProfile.count();
  if (profileCount === 0) {
    await db.userProfile.add({
      id: 'me',
      name: 'Chef Arisaka',
      email: 'chef@kitchenos.io',
      hasCompletedOnboarding: false,
      preferences: {
        darkMode: true,
        notifications: true,
        fontScale: 1.0,
        debugMode: false,
        appTheme: 'noir'
      }
    });
  }
}
