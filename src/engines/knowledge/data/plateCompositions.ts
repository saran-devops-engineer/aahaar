import type { PlatePart } from '@/types/domain'

/**
 * Curated plate parts for each catalog meal.
 * Describes what the serving should consist of — not how to cook it.
 * Mark `optional: true` for recommended add-ons that complete the plate.
 */
export const PLATE_COMPOSITIONS: Record<string, PlatePart[]> = {
  'food-poha': [
    { name: 'Poha (flattened rice)', roles: ['carb'] },
    { name: 'Peanuts', roles: ['protein', 'fat'] },
    { name: 'Onion, green chilli & herbs', roles: ['vegetable'] },
  ],
  'food-idli-sambar': [
    { name: 'Idli', roles: ['carb'] },
    { name: 'Sambar (dal + vegetables)', roles: ['protein', 'vegetable'] },
  ],
  'food-upma': [
    { name: 'Rava / semolina', roles: ['carb'] },
    { name: 'Mixed vegetables', roles: ['vegetable'] },
    { name: 'Dal or peanuts', roles: ['protein'], optional: true },
  ],
  'food-oats-dalia': [
    { name: 'Oats / broken wheat', roles: ['carb'] },
    { name: 'Milk or curd', roles: ['dairy', 'protein'], optional: true },
    { name: 'Vegetables or fruit', roles: ['vegetable', 'fruit'], optional: true },
  ],
  'food-besan-chilla': [
    { name: 'Besan (chickpea flour) batter', roles: ['protein', 'carb'] },
    { name: 'Onion, tomato & greens', roles: ['vegetable'] },
  ],
  'food-dal-rice': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Dal', roles: ['protein'] },
    { name: 'Vegetable side or salad', roles: ['vegetable'] },
  ],
  'food-curd-rice': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Curd', roles: ['dairy', 'protein'] },
    { name: 'Cucumber / carrot tempering veggies', roles: ['vegetable'] },
  ],
  'food-rajma-chawal': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Rajma (kidney beans)', roles: ['protein'] },
    { name: 'Onion-tomato gravy vegetables', roles: ['vegetable'] },
  ],
  'food-khichdi': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Moong dal', roles: ['protein'] },
    { name: 'Vegetables in the pot', roles: ['vegetable'] },
  ],
  'food-fish-curry-rice': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Fish curry', roles: ['protein', 'fat'] },
    { name: 'Curry vegetables / greens', roles: ['vegetable'] },
  ],
  'food-chicken-millet': [
    { name: 'Millet roti', roles: ['carb'] },
    { name: 'Chicken', roles: ['protein'] },
    { name: 'Vegetable side', roles: ['vegetable'] },
  ],
  'food-roti-sabzi': [
    { name: 'Roti', roles: ['carb'] },
    { name: 'Sabzi (cooked vegetables)', roles: ['vegetable'] },
    { name: 'Dal or curd', roles: ['protein', 'dairy'], optional: true },
  ],
  'food-palak-paneer': [
    { name: 'Roti', roles: ['carb'] },
    { name: 'Paneer', roles: ['protein', 'dairy'] },
    { name: 'Palak / spinach', roles: ['vegetable'] },
  ],
  'food-sambar-rice': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Sambar (dal)', roles: ['protein'] },
    { name: 'Sambar vegetables', roles: ['vegetable'] },
  ],
  'food-misal': [
    { name: 'Pav', roles: ['carb'] },
    { name: 'Sprouted misal / legumes', roles: ['protein'] },
    { name: 'Onion, tomato & farsan veggies', roles: ['vegetable'] },
  ],
  'food-thepla': [
    { name: 'Methi thepla', roles: ['carb', 'vegetable'] },
    { name: 'Curd', roles: ['dairy', 'protein'], optional: true },
    { name: 'Dal or sprouts', roles: ['protein'], optional: true },
  ],
  'food-pongal': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Moong dal', roles: ['protein'] },
    { name: 'Pepper, ginger & optional veggies', roles: ['vegetable'] },
  ],
  'food-sprout-salad': [
    { name: 'Sprouts', roles: ['protein'] },
    { name: 'Chopped vegetables', roles: ['vegetable'] },
    { name: 'Roti or millet', roles: ['carb'], optional: true },
  ],
  'food-fruit-chaat': [
    { name: 'Seasonal fruit mix', roles: ['fruit'] },
    { name: 'Chaat spices & herbs', roles: ['vegetable'] },
  ],
  'food-buttermilk': [
    { name: 'Spiced buttermilk (chaas)', roles: ['dairy', 'protein'] },
  ],
  'food-peanut-chikki': [
    { name: 'Peanuts', roles: ['protein', 'fat'] },
    { name: 'Jaggery', roles: ['carb'] },
  ],
  'food-egg-bhurji': [
    { name: 'Roti', roles: ['carb'] },
    { name: 'Egg bhurji', roles: ['protein', 'fat'] },
    { name: 'Onion, tomato & chilli', roles: ['vegetable'] },
  ],
  'food-vegetable-soup': [
    { name: 'Clear vegetable broth', roles: ['vegetable'] },
    { name: 'Mixed vegetables', roles: ['vegetable'] },
    { name: 'Dal or toast', roles: ['protein', 'carb'], optional: true },
  ],
  'food-bajra-khichdi': [
    { name: 'Bajra (pearl millet)', roles: ['carb'] },
    { name: 'Dal', roles: ['protein'] },
    { name: 'Vegetables', roles: ['vegetable'] },
  ],
  'food-coconut-avial': [
    { name: 'Red rice', roles: ['carb'] },
    { name: 'Avial vegetables', roles: ['vegetable'] },
    { name: 'Coconut & curd', roles: ['fat', 'dairy'] },
    { name: 'Dal or legumes', roles: ['protein'], optional: true },
  ],
  'food-chole-kulche': [
    { name: 'Kulcha / bread', roles: ['carb'] },
    { name: 'Chole (chickpeas)', roles: ['protein'] },
    { name: 'Onion, tomato & salad', roles: ['vegetable'] },
  ],
  'food-steamed-hilsa': [
    { name: 'Rice', roles: ['carb'] },
    { name: 'Steamed hilsa', roles: ['protein', 'fat'] },
    { name: 'Mustard greens or side veg', roles: ['vegetable'] },
  ],
  'food-ragi-mudde': [
    { name: 'Ragi mudde', roles: ['carb'] },
    { name: 'Soppu (greens) / sambar', roles: ['vegetable', 'protein'] },
  ],
  'food-lauki-soup': [
    { name: 'Lauki (bottle gourd) soup', roles: ['vegetable'] },
    { name: 'Roti / rice and dal', roles: ['carb', 'protein'], optional: true },
  ],
  'food-paneer-bhurji': [
    { name: 'Paneer bhurji', roles: ['protein', 'dairy'] },
    { name: 'Onion, tomato & spices', roles: ['vegetable'] },
    { name: 'Roti or rice', roles: ['carb'], optional: true },
  ],
}
