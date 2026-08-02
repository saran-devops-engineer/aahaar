export type BmiCategory =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obese_class_1'
  | 'obese_class_2'
  | 'obese_class_3'

/** WHO adult BMI categories. */
export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  if (bmi < 35) return 'obese_class_1'
  if (bmi < 40) return 'obese_class_2'
  return 'obese_class_3'
}

export function bmiCategoryLabel(category: BmiCategory): string {
  switch (category) {
    case 'underweight':
      return 'Underweight'
    case 'normal':
      return 'Normal'
    case 'overweight':
      return 'Overweight'
    case 'obese_class_1':
      return 'Obese (Class I)'
    case 'obese_class_2':
      return 'Obese (Class II)'
    case 'obese_class_3':
      return 'Obese (Class III)'
  }
}
