// 类型定义
export interface Subject {
  id: number
  name: string
  credit: number
  score: number
  semester: string
  selected: boolean
}

export interface Major {
  value: string
  label: string
  file: string
}

export interface ExistingGPA {
  score: number
  credits: number
}

// 辅助函数
export const validateSubjectData = (subject: any): boolean => {
  return (
    typeof subject.id === 'number' &&
    typeof subject.name === 'string' &&
    typeof subject.credit === 'number' &&
    typeof subject.score === 'number' &&
    typeof subject.semester === 'string'
  )
}

export const calculateWeightedAverage = (subjects: Subject[], existingGPA?: ExistingGPA): string => {
  const selectedSubjects = subjects.filter(subject => subject.selected)
  const currentWeightedScore = selectedSubjects.reduce((sum, subject) => 
    sum + subject.score * subject.credit, 0)
  const currentCredits = selectedSubjects.reduce((sum, subject) => 
    sum + subject.credit, 0)
  
  if (existingGPA && existingGPA.credits > 0) {
    const totalWeightedScore = currentWeightedScore + (existingGPA.score * existingGPA.credits)
    const totalCredits = currentCredits + existingGPA.credits
    return totalCredits === 0 ? '0.00' : (totalWeightedScore / totalCredits).toFixed(2)
  }
  
  return currentCredits === 0 ? '0.00' : (currentWeightedScore / currentCredits).toFixed(2)
}

export const calculateTotalCredits = (subjects: Subject[], existingGPA?: ExistingGPA): number => {
  const currentCredits = subjects
    .filter(subject => subject.selected)
    .reduce((sum, subject) => sum + subject.credit, 0)
  
  return currentCredits + (existingGPA?.credits || 0)
}

export const majors: Major[] = [
    { value: 'txgc', label: '通信工程', file: 'txgc.json' },
    { value: 'jqrgc', label: '机器人工程', file: 'jqrgc.json' },
    { value: 'dzxx', label: '电子信息工程', file: 'dzxx.json' },
    { value: 'dxzzs', label: '电子信息工程实验班', file: 'dzxxs.json' },
      { value: 'cs', label: '计算机科学与技术、计算机科学与技术实验班', file: 'cs.json' },
      { value: 'se', label: '软件工程', file: 'se.json' },
      { value: 'bxk', label: '全校必修课', file: 'bxk.json' },
      // 可以继续添加其他专业
    ]