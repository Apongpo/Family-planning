import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ExpenseCategory =
  | 'Groceries'
  | 'Utilities'
  | 'Transportation'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Housing'
  | 'Other'

type IncomeCategory = 'Salary' | 'Freelance' | 'Benefits' | 'Gift' | 'Other Income'
type Recurrence = 'Weekly' | 'Monthly' | 'Yearly'
type RecurringKind = 'Expense' | 'Income'

type Expense = {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  person: string
}

type Income = {
  id: string
  source: string
  amount: number
  category: IncomeCategory
  date: string
  person: string
}

type BudgetLimit = {
  category: ExpenseCategory
  monthlyLimit: number
}

type RecurringItem = {
  id: string
  label: string
  amount: number
  kind: RecurringKind
  frequency: Recurrence
  startDate: string
  endDate?: string
  isPaused?: boolean
  skippedOccurrences?: string[]
  person: string
  expenseCategory?: ExpenseCategory
  incomeCategory?: IncomeCategory
}

type ExpenseFormState = {
  description: string
  amount: string
  category: ExpenseCategory
  date: string
  person: string
}

type IncomeFormState = {
  source: string
  amount: string
  category: IncomeCategory
  date: string
  person: string
}

type RecurringFormState = {
  label: string
  amount: string
  kind: RecurringKind
  frequency: Recurrence
  startDate: string
  endDate: string
  isPaused: boolean
  person: string
  expenseCategory: ExpenseCategory
  incomeCategory: IncomeCategory
}

type RecurringMonthlyEntry = RecurringItem & {
  occurrences: number
  occurrenceDates: string[]
  totalAmount: number
}

type ReminderEntry = {
  id: string
  title: string
  date: string
  amount: number
  person: string
  type: 'Expense' | 'Income'
  isRecurring: boolean
}

type UserProfile = {
  id: string
  name: string
}

type UserModalMode = 'new' | 'rename' | 'delete'

const ALL_MEMBERS = 'All household members'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Groceries',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Education',
  'Housing',
  'Other',
]

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary',
  'Freelance',
  'Benefits',
  'Gift',
  'Other Income',
]

const RECURRENCE_OPTIONS: Recurrence[] = ['Weekly', 'Monthly', 'Yearly']

const DEFAULT_BUDGET_LIMITS: BudgetLimit[] = [
  { category: 'Groceries', monthlyLimit: 800 },
  { category: 'Utilities', monthlyLimit: 300 },
  { category: 'Transportation', monthlyLimit: 400 },
  { category: 'Entertainment', monthlyLimit: 200 },
  { category: 'Healthcare', monthlyLimit: 150 },
  { category: 'Education', monthlyLimit: 250 },
  { category: 'Housing', monthlyLimit: 1500 },
  { category: 'Other', monthlyLimit: 200 },
]

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'expense-1',
    description: 'Weekly grocery shopping',
    amount: 125.5,
    category: 'Groceries',
    date: '2026-04-10',
    person: 'Mom',
  },
  {
    id: 'expense-2',
    description: 'Electric bill',
    amount: 95,
    category: 'Utilities',
    date: '2026-04-08',
    person: 'Dad',
  },
  {
    id: 'expense-3',
    description: 'Gas for car',
    amount: 60,
    category: 'Transportation',
    date: '2026-04-12',
    person: 'Dad',
  },
  {
    id: 'expense-4',
    description: 'Movie tickets',
    amount: 45,
    category: 'Entertainment',
    date: '2026-04-11',
    person: 'Family',
  },
]

const DEFAULT_INCOMES: Income[] = [
  {
    id: 'income-1',
    source: 'Primary salary',
    amount: 3200,
    category: 'Salary',
    date: '2026-04-01',
    person: 'Dad',
  },
  {
    id: 'income-2',
    source: 'Side consulting',
    amount: 600,
    category: 'Freelance',
    date: '2026-04-13',
    person: 'Mom',
  },
]

const DEFAULT_RECURRING_ITEMS: RecurringItem[] = [
  {
    id: 'recurring-1',
    label: 'Rent',
    amount: 1200,
    kind: 'Expense',
    frequency: 'Monthly',
    startDate: '2026-01-01',
    person: 'Family',
    expenseCategory: 'Housing',
  },
  {
    id: 'recurring-2',
    label: 'Internet plan',
    amount: 75,
    kind: 'Expense',
    frequency: 'Monthly',
    startDate: '2026-01-05',
    person: 'Family',
    expenseCategory: 'Utilities',
  },
  {
    id: 'recurring-3',
    label: 'Main paycheck',
    amount: 3200,
    kind: 'Income',
    frequency: 'Monthly',
    startDate: '2026-01-01',
    person: 'Dad',
    incomeCategory: 'Salary',
  },
]

const STORAGE_KEY = 'family-budget-tracker-v2-expenses'
const INCOME_STORAGE_KEY = 'family-budget-tracker-v2-incomes'
const BUDGET_KEY = 'family-budget-tracker-v2-budgets'
const RECURRING_KEY = 'family-budget-tracker-v2-recurring'
const REMINDER_SETTINGS_KEY = 'family-budget-tracker-v2-reminder-settings'
const INCOME_ADJUSTMENT_SOURCE = '[Adjustment] Total income override'
const USERS_STORAGE_KEY = 'family-budget-tracker-v2-users'
const ACTIVE_USER_STORAGE_KEY = 'family-budget-tracker-v2-active-user'
const DEFAULT_USER: UserProfile = { id: 'default-user', name: 'Default User' }

function getCategoryColor(category: ExpenseCategory): string {
  const colors: Record<ExpenseCategory, string> = {
    Groceries: '#2a7fc9',
    Utilities: '#d88d2b',
    Transportation: '#1f7a62',
    Entertainment: '#f5945c',
    Healthcare: '#d84832',
    Education: '#8b4b9e',
    Housing: '#c14b33',
    Other: '#36524d',
  }

  return colors[category]
}

function getIncomeColor(category: IncomeCategory): string {
  const colors: Record<IncomeCategory, string> = {
    Salary: '#2563eb',
    Freelance: '#14b8a6',
    Benefits: '#0f766e',
    Gift: '#f59e0b',
    'Other Income': '#6b7280',
  }

  return colors[category]
}

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function createEmptyExpense(): ExpenseFormState {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return {
    description: '',
    amount: '',
    category: 'Other',
    date: dateStr,
    person: '',
  }
}

function createEmptyIncome(): IncomeFormState {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return {
    source: '',
    amount: '',
    category: 'Salary',
    date: dateStr,
    person: '',
  }
}

function createEmptyRecurring(): RecurringFormState {
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return {
    label: '',
    amount: '',
    kind: 'Expense',
    frequency: 'Monthly',
    startDate: dateStr,
    endDate: '',
    isPaused: false,
    person: '',
    expenseCategory: 'Other',
    incomeCategory: 'Salary',
  }
}

function parseSavedArray<T>(value: string | null): T[] | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as T[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function toDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`)
}

function getMonthFromDate(dateStr: string): string {
  return formatMonthKey(toDate(dateStr))
}

function toLocalDate(dateStr: string): string {
  return toDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function escapeCsvValue(value: string | number): string {
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTooltipValue(value: string | number | readonly (string | number)[] | undefined): string {
  const rawValue = Array.isArray(value) ? value[0] : value
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue || 0)
  return formatCurrencyValue(numericValue)
}

function sortByDateDesc<T extends { date: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) => toDate(right.date).getTime() - toDate(left.date).getTime())
}

function formatRecurrence(value: Recurrence): string {
  if (value === 'Weekly') return 'weekly'
  if (value === 'Monthly') return 'monthly'
  return 'yearly'
}

function matchesMember(person: string, selectedMember: string): boolean {
  return selectedMember === ALL_MEMBERS || person === selectedMember
}

function toMemberKey(member: string): string {
  return member.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'all'
}

function getIncomeAdjustmentId(month: string, member: string): string {
  return `income-adjustment-${month}-${toMemberKey(member)}`
}

function buildScopedStorageKey(baseKey: string, userId: string): string {
  return `${baseKey}-${userId}`
}

function getUniqueUserId(name: string, existingUsers: UserProfile[]): string {
  const baseId = toMemberKey(name)
  if (!existingUsers.some((user) => user.id === baseId)) {
    return baseId
  }

  let suffix = 2
  while (existingUsers.some((user) => user.id === `${baseId}-${suffix}`)) {
    suffix += 1
  }

  return `${baseId}-${suffix}`
}

function dateToIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addMonthsClamped(date: Date, count: number, anchorDay: number): Date {
  const targetMonthIndex = date.getMonth() + count
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12)
  const monthInYear = ((targetMonthIndex % 12) + 12) % 12
  const daysInMonth = new Date(targetYear, monthInYear + 1, 0).getDate()
  const day = Math.min(anchorDay, daysInMonth)

  return new Date(targetYear, monthInYear, day)
}

function addYearsClamped(date: Date, count: number, anchorMonth: number, anchorDay: number): Date {
  const targetYear = date.getFullYear() + count
  const daysInMonth = new Date(targetYear, anchorMonth + 1, 0).getDate()
  const day = Math.min(anchorDay, daysInMonth)

  return new Date(targetYear, anchorMonth, day)
}

function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

function getRecurringOccurrencesInRange(item: RecurringItem, start: Date, end: Date): string[] {
  if (item.isPaused) {
    return []
  }

  const startDate = toDate(item.startDate)
  const itemEndDate = item.endDate ? toDate(item.endDate) : null
  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const effectiveEnd = itemEndDate && itemEndDate < normalizedEnd ? itemEndDate : normalizedEnd

  if (startDate > effectiveEnd) {
    return []
  }

  const skippedDates = new Set(item.skippedOccurrences || [])
  const occurrences: string[] = []

  if (item.frequency === 'Weekly') {
    const cursor = new Date(startDate)
    while (cursor <= effectiveEnd) {
      if (cursor >= normalizedStart) {
        const isoDate = dateToIsoDate(cursor)
        if (!skippedDates.has(isoDate)) {
          occurrences.push(isoDate)
        }
      }
      cursor.setDate(cursor.getDate() + 7)
    }
    return occurrences
  }

  if (item.frequency === 'Monthly') {
    const anchorDay = startDate.getDate()
    let cursor = new Date(startDate)
    while (cursor <= effectiveEnd) {
      if (cursor >= normalizedStart) {
        const isoDate = dateToIsoDate(cursor)
        if (!skippedDates.has(isoDate)) {
          occurrences.push(isoDate)
        }
      }
      cursor = addMonthsClamped(cursor, 1, anchorDay)
    }
    return occurrences
  }

  const anchorMonth = startDate.getMonth()
  const anchorDay = startDate.getDate()
  let cursor = new Date(startDate)
  while (cursor <= effectiveEnd) {
    if (cursor >= normalizedStart) {
      const isoDate = dateToIsoDate(cursor)
      if (!skippedDates.has(isoDate)) {
        occurrences.push(isoDate)
      }
    }
    cursor = addYearsClamped(cursor, 1, anchorMonth, anchorDay)
  }

  return occurrences
}

function playAlarmTone() {
  if (typeof window === 'undefined') return

  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return

  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.value = 880
  gain.gain.value = 0.0001

  oscillator.connect(gain)
  gain.connect(context.destination)

  const now = context.currentTime
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)

  oscillator.start(now)
  oscillator.stop(now + 0.45)
}

function App() {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (typeof window === 'undefined') return [DEFAULT_USER]

    const savedUsers = parseSavedArray<UserProfile>(window.localStorage.getItem(USERS_STORAGE_KEY))
    if (!savedUsers || savedUsers.length === 0) {
      return [DEFAULT_USER]
    }

    const cleanedUsers = savedUsers.filter((user) => user.id && user.name)
    return cleanedUsers.length > 0 ? cleanedUsers : [DEFAULT_USER]
  })
  const [activeUserId, setActiveUserId] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_USER.id
    return window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY) || DEFAULT_USER.id
  })
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_EXPENSES
    return parseSavedArray<Expense>(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_EXPENSES
  })
  const [incomes, setIncomes] = useState<Income[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_INCOMES
    return parseSavedArray<Income>(window.localStorage.getItem(INCOME_STORAGE_KEY)) ?? DEFAULT_INCOMES
  })
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_BUDGET_LIMITS
    return parseSavedArray<BudgetLimit>(window.localStorage.getItem(BUDGET_KEY)) ?? DEFAULT_BUDGET_LIMITS
  })
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_RECURRING_ITEMS
    return parseSavedArray<RecurringItem>(window.localStorage.getItem(RECURRING_KEY)) ?? DEFAULT_RECURRING_ITEMS
  })
  const [selectedMonth, setSelectedMonth] = useState(() => formatMonthKey(new Date()))
  const [selectedMember, setSelectedMember] = useState(ALL_MEMBERS)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [alarmEnabled, setAlarmEnabled] = useState(true)
  const [reminderLeadDays, setReminderLeadDays] = useState(3)
  const [activeAlarmText, setActiveAlarmText] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null)
  const [isEditingTotalIncome, setIsEditingTotalIncome] = useState(false)
  const [totalIncomeInput, setTotalIncomeInput] = useState('')
  const [expenseFormState, setExpenseFormState] = useState<ExpenseFormState>(createEmptyExpense)
  const [incomeFormState, setIncomeFormState] = useState<IncomeFormState>(createEmptyIncome)
  const [recurringFormState, setRecurringFormState] = useState<RecurringFormState>(createEmptyRecurring)
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<ExpenseCategory | null>(null)
  const [budgetEditAmount, setBudgetEditAmount] = useState('')
  const [userModalMode, setUserModalMode] = useState<UserModalMode | null>(null)
  const [userModalInput, setUserModalInput] = useState('')
  const [userModalError, setUserModalError] = useState('')
  const userDataReadyRef = useRef(false)
  const notifiedReminderIdsRef = useRef<Set<string>>(new Set())

  const activeUser = useMemo(() => {
    return users.find((user) => user.id === activeUserId) || users[0] || DEFAULT_USER
  }, [activeUserId, users])

  useEffect(() => {
    if (!users.some((user) => user.id === activeUserId)) {
      setActiveUserId(users[0]?.id || DEFAULT_USER.id)
    }
  }, [activeUserId, users])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUser.id)
  }, [activeUser.id])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const expenseKey = buildScopedStorageKey(STORAGE_KEY, activeUser.id)
    const incomeKey = buildScopedStorageKey(INCOME_STORAGE_KEY, activeUser.id)
    const budgetKey = buildScopedStorageKey(BUDGET_KEY, activeUser.id)
    const recurringKey = buildScopedStorageKey(RECURRING_KEY, activeUser.id)

    const fallbackExpenses =
      activeUser.id === DEFAULT_USER.id
        ? parseSavedArray<Expense>(window.localStorage.getItem(STORAGE_KEY)) || DEFAULT_EXPENSES
        : []
    const fallbackIncomes =
      activeUser.id === DEFAULT_USER.id
        ? parseSavedArray<Income>(window.localStorage.getItem(INCOME_STORAGE_KEY)) || DEFAULT_INCOMES
        : []
    const fallbackRecurring =
      activeUser.id === DEFAULT_USER.id
        ? parseSavedArray<RecurringItem>(window.localStorage.getItem(RECURRING_KEY)) || DEFAULT_RECURRING_ITEMS
        : []

    userDataReadyRef.current = false

    setExpenses(parseSavedArray<Expense>(window.localStorage.getItem(expenseKey)) ?? fallbackExpenses)
    setIncomes(parseSavedArray<Income>(window.localStorage.getItem(incomeKey)) ?? fallbackIncomes)
    setBudgets(parseSavedArray<BudgetLimit>(window.localStorage.getItem(budgetKey)) ?? DEFAULT_BUDGET_LIMITS)
    setRecurringItems(parseSavedArray<RecurringItem>(window.localStorage.getItem(recurringKey)) ?? fallbackRecurring)

    setSelectedMonth(formatMonthKey(new Date()))
    setSelectedMember(ALL_MEMBERS)
    setEditingExpenseId(null)
    setEditingIncomeId(null)
    setEditingRecurringId(null)
    setIsEditingTotalIncome(false)
    setTotalIncomeInput('')
    setEditingBudgetCategory(null)
    setBudgetEditAmount('')
    setExpenseFormState(createEmptyExpense())
    setIncomeFormState(createEmptyIncome())
    setRecurringFormState(createEmptyRecurring())
    setActiveAlarmText(null)
    notifiedReminderIdsRef.current.clear()

    userDataReadyRef.current = true
  }, [activeUser.id])

  useEffect(() => {
    if (!userDataReadyRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(buildScopedStorageKey(STORAGE_KEY, activeUser.id), JSON.stringify(expenses))
  }, [activeUser.id, expenses])

  useEffect(() => {
    if (!userDataReadyRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(buildScopedStorageKey(INCOME_STORAGE_KEY, activeUser.id), JSON.stringify(incomes))
  }, [activeUser.id, incomes])

  useEffect(() => {
    if (!userDataReadyRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(buildScopedStorageKey(BUDGET_KEY, activeUser.id), JSON.stringify(budgets))
  }, [activeUser.id, budgets])

  useEffect(() => {
    if (!userDataReadyRef.current || typeof window === 'undefined') return
    window.localStorage.setItem(buildScopedStorageKey(RECURRING_KEY, activeUser.id), JSON.stringify(recurringItems))
  }, [activeUser.id, recurringItems])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = window.localStorage.getItem(buildScopedStorageKey(REMINDER_SETTINGS_KEY, activeUser.id))
    if (!saved) {
      setNotificationsEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted')
      return
    }

    try {
      const parsed = JSON.parse(saved) as {
        alarmEnabled?: boolean
        reminderLeadDays?: number
      }
      if (typeof parsed.alarmEnabled === 'boolean') {
        setAlarmEnabled(parsed.alarmEnabled)
      }
      if (typeof parsed.reminderLeadDays === 'number') {
        setReminderLeadDays(Math.min(14, Math.max(0, Math.round(parsed.reminderLeadDays))))
      }
    } catch {
      // Ignore invalid reminder settings.
    }

    setNotificationsEnabled(typeof Notification !== 'undefined' && Notification.permission === 'granted')
  }, [activeUser.id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!userDataReadyRef.current) return

    window.localStorage.setItem(
      buildScopedStorageKey(REMINDER_SETTINGS_KEY, activeUser.id),
      JSON.stringify({
        alarmEnabled,
        reminderLeadDays,
      }),
    )
  }, [activeUser.id, alarmEnabled, reminderLeadDays])

  useEffect(() => {
    if (!toastMessage) return

    const timer = window.setTimeout(() => {
      setToastMessage(null)
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const recurringEntriesForMonth = useMemo<RecurringMonthlyEntry[]>(() => {
    return recurringItems
      .map((item) => {
        const monthStart = new Date(`${selectedMonth}-01T00:00:00`)
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
        const occurrenceDates = getRecurringOccurrencesInRange(item, monthStart, monthEnd)
        const occurrences = occurrenceDates.length
        return {
          ...item,
          occurrences,
          occurrenceDates,
          totalAmount: occurrences * item.amount,
        }
      })
      .filter((item) => item.occurrences > 0)
  }, [recurringItems, selectedMonth])

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense) => getMonthFromDate(expense.date) === selectedMonth)
  }, [expenses, selectedMonth])

  const monthlyIncomes = useMemo(() => {
    return incomes.filter((income) => getMonthFromDate(income.date) === selectedMonth)
  }, [incomes, selectedMonth])

  const filteredExpenses = useMemo(() => {
    return monthlyExpenses.filter((expense) => matchesMember(expense.person, selectedMember))
  }, [monthlyExpenses, selectedMember])

  const filteredIncomes = useMemo(() => {
    return monthlyIncomes.filter((income) => matchesMember(income.person, selectedMember))
  }, [monthlyIncomes, selectedMember])

  const selectedIncomeAdjustmentId = useMemo(() => {
    return getIncomeAdjustmentId(selectedMonth, selectedMember)
  }, [selectedMonth, selectedMember])

  const selectedIncomeAdjustment = useMemo(() => {
    return filteredIncomes.find((income) => income.id === selectedIncomeAdjustmentId) || null
  }, [filteredIncomes, selectedIncomeAdjustmentId])

  const filteredIncomesWithoutAdjustment = useMemo(() => {
    return filteredIncomes.filter((income) => income.id !== selectedIncomeAdjustmentId)
  }, [filteredIncomes, selectedIncomeAdjustmentId])

  const filteredRecurringEntries = useMemo(() => {
    return recurringEntriesForMonth.filter((entry) => matchesMember(entry.person, selectedMember))
  }, [recurringEntriesForMonth, selectedMember])

  const recurringExpenseEntries = useMemo(() => {
    return filteredRecurringEntries.filter((entry) => entry.kind === 'Expense')
  }, [filteredRecurringEntries])

  const recurringIncomeEntries = useMemo(() => {
    return filteredRecurringEntries.filter((entry) => entry.kind === 'Income')
  }, [filteredRecurringEntries])

  const totalRecurringExpense = useMemo(() => {
    return recurringExpenseEntries.reduce((sum, entry) => sum + entry.totalAmount, 0)
  }, [recurringExpenseEntries])

  const totalRecurringIncome = useMemo(() => {
    return recurringIncomeEntries.reduce((sum, entry) => sum + entry.totalAmount, 0)
  }, [recurringIncomeEntries])

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) + totalRecurringExpense
  }, [filteredExpenses, totalRecurringExpense])

  const baseTotalIncome = useMemo(() => {
    return filteredIncomesWithoutAdjustment.reduce((sum, income) => sum + income.amount, 0) + totalRecurringIncome
  }, [filteredIncomesWithoutAdjustment, totalRecurringIncome])

  const totalIncome = useMemo(() => {
    return baseTotalIncome + (selectedIncomeAdjustment?.amount || 0)
  }, [baseTotalIncome, selectedIncomeAdjustment])

  const netAmount = totalIncome - totalSpent

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0)
  }, [budgets])

  const categoryTotals = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>()
    EXPENSE_CATEGORIES.forEach((category) => totals.set(category, 0))

    filteredExpenses.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount)
    })

    recurringExpenseEntries.forEach((entry) => {
      const category = entry.expenseCategory || 'Other'
      totals.set(category, (totals.get(category) || 0) + entry.totalAmount)
    })

    return totals
  }, [filteredExpenses, recurringExpenseEntries])

  const budgetStatus = useMemo(() => {
    return budgets.map((budget) => {
      const spent = categoryTotals.get(budget.category) || 0
      const remaining = budget.monthlyLimit - spent
      const percentUsed = budget.monthlyLimit === 0 ? 0 : Math.round((spent / budget.monthlyLimit) * 100)

      return {
        category: budget.category,
        limit: budget.monthlyLimit,
        spent,
        remaining,
        percentUsed,
        isOverBudget: spent > budget.monthlyLimit,
      }
    })
  }, [budgets, categoryTotals])

  const overBudgetCategories = useMemo(() => {
    return budgetStatus.filter((status) => status.isOverBudget)
  }, [budgetStatus])

  const categorySummaryRows = useMemo(() => {
    return EXPENSE_CATEGORIES.map((category) => {
      const amount = categoryTotals.get(category) || 0
      const share = totalSpent === 0 ? 0 : Math.round((amount / totalSpent) * 100)
      return { category, amount, share }
    })
      .filter((row) => row.amount > 0)
      .sort((left, right) => right.amount - left.amount)
  }, [categoryTotals, totalSpent])

  const categoryChartData = useMemo(() => {
    return categorySummaryRows.map((row) => ({
      name: row.category,
      value: row.amount,
      share: row.share,
      color: getCategoryColor(row.category),
    }))
  }, [categorySummaryRows])

  const memberOptions = useMemo(() => {
    const members = new Set<string>()
    expenses.forEach((expense) => members.add(expense.person))
    incomes.forEach((income) => members.add(income.person))
    recurringItems.forEach((item) => members.add(item.person))
    return [ALL_MEMBERS, ...Array.from(members).sort()]
  }, [expenses, incomes, recurringItems])

  const reminderEntries = useMemo<ReminderEntry[]>(() => {
    const today = new Date()
    const rangeStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const rangeEnd = new Date(rangeStart)
    rangeEnd.setDate(rangeEnd.getDate() + reminderLeadDays)

    const entries: ReminderEntry[] = []

    expenses.forEach((expense) => {
      if (!matchesMember(expense.person, selectedMember)) return
      const date = toDate(expense.date)
      if (date >= rangeStart && date <= rangeEnd) {
        entries.push({
          id: `expense-${expense.id}`,
          title: expense.description,
          date: expense.date,
          amount: expense.amount,
          person: expense.person,
          type: 'Expense',
          isRecurring: false,
        })
      }
    })

    incomes.forEach((income) => {
      if (!matchesMember(income.person, selectedMember)) return
      const date = toDate(income.date)
      if (date >= rangeStart && date <= rangeEnd) {
        entries.push({
          id: `income-${income.id}`,
          title: income.source,
          date: income.date,
          amount: income.amount,
          person: income.person,
          type: 'Income',
          isRecurring: false,
        })
      }
    })

    recurringItems.forEach((item) => {
      if (!matchesMember(item.person, selectedMember)) return

      const occurrences = getRecurringOccurrencesInRange(item, rangeStart, rangeEnd)
      occurrences.forEach((occurrenceDate) => {
        entries.push({
          id: `recurring-${item.id}-${occurrenceDate}`,
          title: item.label,
          date: occurrenceDate,
          amount: item.amount,
          person: item.person,
          type: item.kind,
          isRecurring: true,
        })
      })
    })

    return entries.sort((left, right) => toDate(left.date).getTime() - toDate(right.date).getTime())
  }, [expenses, incomes, recurringItems, reminderLeadDays, selectedMember])

  const dueTodayReminders = useMemo(() => {
    const todayKey = dateToIsoDate(new Date())
    return reminderEntries.filter((entry) => entry.date === todayKey)
  }, [reminderEntries])

  const nextReminder = reminderEntries[0] || null

  const memberTotals = useMemo(() => {
    const totals = new Map<string, { spent: number; income: number }>()

    function ensureMember(member: string) {
      if (!totals.has(member)) {
        totals.set(member, { spent: 0, income: 0 })
      }
      return totals.get(member) as { spent: number; income: number }
    }

    monthlyExpenses.forEach((expense) => {
      ensureMember(expense.person).spent += expense.amount
    })

    monthlyIncomes.forEach((income) => {
      ensureMember(income.person).income += income.amount
    })

    recurringEntriesForMonth.forEach((entry) => {
      const target = ensureMember(entry.person)
      if (entry.kind === 'Expense') {
        target.spent += entry.totalAmount
      } else {
        target.income += entry.totalAmount
      }
    })

    return Array.from(totals.entries())
      .map(([member, values]) => ({
        member,
        spent: values.spent,
        income: values.income,
        net: values.income - values.spent,
      }))
      .filter((row) => matchesMember(row.member, selectedMember))
      .sort((left, right) => right.spent - left.spent)
  }, [monthlyExpenses, monthlyIncomes, recurringEntriesForMonth, selectedMember])

  const cashFlowChartData = useMemo(() => {
    return [
      { name: 'Income', amount: totalIncome, color: '#2563eb' },
      { name: 'Spent', amount: totalSpent, color: '#ef4444' },
      { name: 'Budget', amount: totalBudget, color: '#f59e0b' },
    ]
  }, [totalBudget, totalIncome, totalSpent])

  const memberChartData = useMemo(() => {
    return memberTotals.map((row) => ({
      name: row.member,
      income: row.income,
      spent: row.spent,
    }))
  }, [memberTotals])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    const now = new Date()

    // Keep the selector open well beyond the current year while preserving historical context.
    let earliestMonth = addMonths(now, -12)
    let latestMonth = addMonths(now, 120)

    const dataDates = [
      ...expenses.map((expense) => toDate(expense.date)),
      ...incomes.map((income) => toDate(income.date)),
      ...recurringItems.map((item) => toDate(item.startDate)),
      toDate(`${selectedMonth}-01`),
    ]

    dataDates.forEach((date) => {
      const monthDate = new Date(date.getFullYear(), date.getMonth(), 1)
      if (monthDate < earliestMonth) {
        earliestMonth = monthDate
      }
      if (monthDate > latestMonth) {
        latestMonth = monthDate
      }
    })

    const cursor = new Date(earliestMonth)
    while (cursor <= latestMonth) {
      months.add(formatMonthKey(cursor))
      cursor.setMonth(cursor.getMonth() + 1)
    }

    expenses.forEach((expense) => months.add(getMonthFromDate(expense.date)))
    incomes.forEach((income) => months.add(getMonthFromDate(income.date)))
    recurringItems.forEach((item) => months.add(getMonthFromDate(item.startDate)))
    months.add(selectedMonth)

    return Array.from(months).sort().reverse()
  }, [expenses, incomes, recurringItems, selectedMonth])

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-')
    return new Date(`${year}-${month}-01`).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }, [selectedMonth])

  const totalActivityCount =
    filteredExpenses.length + filteredIncomes.length + recurringExpenseEntries.length + recurringIncomeEntries.length

  useEffect(() => {
    if (!alarmEnabled || dueTodayReminders.length === 0) {
      return
    }

    const toNotify = dueTodayReminders.filter((entry) => !notifiedReminderIdsRef.current.has(entry.id))

    if (toNotify.length === 0) {
      return
    }

    setActiveAlarmText(`You have ${toNotify.length} reminder${toNotify.length > 1 ? 's' : ''} due today.`)
    playAlarmTone()

    if (notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      toNotify.slice(0, 3).forEach((entry) => {
        const label = entry.type === 'Expense' ? 'Payment due' : 'Income expected'
        new Notification(`${label}: ${entry.title}`, {
          body: `${entry.person} • ${formatCurrencyValue(entry.amount)}`,
        })
      })
    }

    toNotify.forEach((entry) => notifiedReminderIdsRef.current.add(entry.id))
  }, [alarmEnabled, dueTodayReminders, notificationsEnabled])

  function updateExpenseForm<K extends keyof ExpenseFormState>(field: K, value: ExpenseFormState[K]) {
    setExpenseFormState((previous) => ({ ...previous, [field]: value }))
  }

  function updateIncomeForm<K extends keyof IncomeFormState>(field: K, value: IncomeFormState[K]) {
    setIncomeFormState((previous) => ({ ...previous, [field]: value }))
  }

  function updateRecurringForm<K extends keyof RecurringFormState>(
    field: K,
    value: RecurringFormState[K],
  ) {
    setRecurringFormState((previous) => ({ ...previous, [field]: value }))
  }

  function resetExpenseForm() {
    setEditingExpenseId(null)
    setExpenseFormState(createEmptyExpense())
  }

  function resetIncomeForm() {
    setEditingIncomeId(null)
    setIncomeFormState(createEmptyIncome())
  }

  function resetRecurringForm() {
    setEditingRecurringId(null)
    setRecurringFormState(createEmptyRecurring())
  }

  function beginEditExpense(expense: Expense) {
    setEditingExpenseId(expense.id)
    setExpenseFormState({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      person: expense.person,
    })
  }

  function beginEditIncome(income: Income) {
    setEditingIncomeId(income.id)
    setIncomeFormState({
      source: income.source,
      amount: income.amount.toString(),
      category: income.category,
      date: income.date,
      person: income.person,
    })
  }

  function beginEditRecurring(item: RecurringItem) {
    setEditingRecurringId(item.id)
    setRecurringFormState({
      label: item.label,
      amount: item.amount.toString(),
      kind: item.kind,
      frequency: item.frequency,
      startDate: item.startDate,
      endDate: item.endDate || '',
      isPaused: item.isPaused || false,
      person: item.person,
      expenseCategory: item.expenseCategory || 'Other',
      incomeCategory: item.incomeCategory || 'Salary',
    })
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !expenseFormState.description.trim() ||
      !expenseFormState.amount.trim() ||
      !expenseFormState.person.trim()
    ) {
      window.alert('Please fill in all expense fields.')
      return
    }

    const amount = Number(expenseFormState.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      window.alert('Expense amount must be a positive number.')
      return
    }

    const nextExpense: Expense = {
      id: editingExpenseId || `expense-${Date.now()}`,
      description: expenseFormState.description.trim(),
      amount,
      category: expenseFormState.category,
      date: expenseFormState.date,
      person: expenseFormState.person.trim(),
    }

    setExpenses((previous) => {
      if (!editingExpenseId) {
        return sortByDateDesc([...previous, nextExpense])
      }

      return sortByDateDesc(
        previous.map((expense) => (expense.id === editingExpenseId ? nextExpense : expense)),
      )
    })

    resetExpenseForm()
  }

  function saveIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!incomeFormState.source.trim() || !incomeFormState.amount.trim() || !incomeFormState.person.trim()) {
      window.alert('Please fill in all income fields.')
      return
    }

    const amount = Number(incomeFormState.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      window.alert('Income amount must be a positive number.')
      return
    }

    const nextIncome: Income = {
      id: editingIncomeId || `income-${Date.now()}`,
      source: incomeFormState.source.trim(),
      amount,
      category: incomeFormState.category,
      date: incomeFormState.date,
      person: incomeFormState.person.trim(),
    }

    setIncomes((previous) => {
      if (!editingIncomeId) {
        return sortByDateDesc([...previous, nextIncome])
      }

      return sortByDateDesc(
        previous.map((income) => (income.id === editingIncomeId ? nextIncome : income)),
      )
    })

    resetIncomeForm()
  }

  async function enableBrowserNotifications() {
    if (typeof Notification === 'undefined') {
      window.alert('This browser does not support notifications.')
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')

    if (permission !== 'granted') {
      window.alert('Notification permission was not granted.')
    }
  }

  function switchActiveUser(nextUserId: string) {
    userDataReadyRef.current = false
    setActiveUserId(nextUserId)
  }

  function openUserModal(mode: UserModalMode) {
    setUserModalMode(mode)
    setUserModalError('')

    if (mode === 'new') {
      setUserModalInput('')
      return
    }

    setUserModalInput(activeUser.name)
  }

  function closeUserModal() {
    setUserModalMode(null)
    setUserModalInput('')
    setUserModalError('')
  }

  function submitUserModal() {
    if (!userModalMode) return

    if (userModalMode === 'delete') {
      if (users.length <= 1) {
        setUserModalError('At least one user profile must remain.')
        return
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(buildScopedStorageKey(STORAGE_KEY, activeUser.id))
        window.localStorage.removeItem(buildScopedStorageKey(INCOME_STORAGE_KEY, activeUser.id))
        window.localStorage.removeItem(buildScopedStorageKey(RECURRING_KEY, activeUser.id))
        window.localStorage.removeItem(buildScopedStorageKey(BUDGET_KEY, activeUser.id))
        window.localStorage.removeItem(buildScopedStorageKey(REMINDER_SETTINGS_KEY, activeUser.id))
      }

      const remainingUsers = users.filter((user) => user.id !== activeUser.id)
      const fallbackUserId = remainingUsers[0]?.id || DEFAULT_USER.id

      setUsers(remainingUsers)
      switchActiveUser(fallbackUserId)
      closeUserModal()
      return
    }

    const nextName = userModalInput.trim()

    if (!nextName) {
      setUserModalError('Please enter a user name.')
      return
    }

    if (userModalMode === 'new') {
      const nextUser: UserProfile = {
        id: getUniqueUserId(nextName, users),
        name: nextName,
      }

      setUsers((previous) => [...previous, nextUser])
      switchActiveUser(nextUser.id)
      closeUserModal()
      return
    }

    if (!nextName || nextName === activeUser.name) {
      closeUserModal()
      return
    }

    setUsers((previous) =>
      previous.map((user) => {
        if (user.id !== activeUser.id) {
          return user
        }

        return {
          ...user,
          name: nextName,
        }
      }),
    )
    closeUserModal()
  }

  function clearCurrentUserData() {
    if (!window.confirm(`Clear all data for ${activeUser.name} and start fresh?`)) {
      return
    }

    setExpenses([])
    setIncomes([])
    setRecurringItems([])
    setBudgets(DEFAULT_BUDGET_LIMITS)
    setSelectedMonth(formatMonthKey(new Date()))
    setSelectedMember(ALL_MEMBERS)
    setEditingExpenseId(null)
    setEditingIncomeId(null)
    setEditingRecurringId(null)
    setEditingBudgetCategory(null)
    setBudgetEditAmount('')
    setIsEditingTotalIncome(false)
    setTotalIncomeInput('')
    setExpenseFormState(createEmptyExpense())
    setIncomeFormState(createEmptyIncome())
    setRecurringFormState(createEmptyRecurring())
    setAlarmEnabled(true)
    setReminderLeadDays(3)
    setActiveAlarmText(null)
    notifiedReminderIdsRef.current.clear()

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(buildScopedStorageKey(STORAGE_KEY, activeUser.id))
      window.localStorage.removeItem(buildScopedStorageKey(INCOME_STORAGE_KEY, activeUser.id))
      window.localStorage.removeItem(buildScopedStorageKey(RECURRING_KEY, activeUser.id))
      window.localStorage.removeItem(buildScopedStorageKey(BUDGET_KEY, activeUser.id))
      window.localStorage.removeItem(buildScopedStorageKey(REMINDER_SETTINGS_KEY, activeUser.id))
    }
  }

  function beginEditTotalIncome() {
    setIsEditingTotalIncome(true)
    setTotalIncomeInput(totalIncome.toString())
  }

  function saveTotalIncomeOverride() {
    if (!totalIncomeInput.trim()) {
      window.alert('Please enter a total income value.')
      return
    }

    const targetTotalIncome = Number(totalIncomeInput)
    if (Number.isNaN(targetTotalIncome) || targetTotalIncome < 0) {
      window.alert('Total income must be a non-negative number.')
      return
    }

    const adjustmentAmount = targetTotalIncome - baseTotalIncome
    const memberForEntry = selectedMember === ALL_MEMBERS ? 'Family' : selectedMember

    setIncomes((previous) => {
      const withoutCurrentAdjustment = previous.filter((income) => income.id !== selectedIncomeAdjustmentId)

      if (Math.abs(adjustmentAmount) < 0.005) {
        return withoutCurrentAdjustment
      }

      const adjustmentEntry: Income = {
        id: selectedIncomeAdjustmentId,
        source: INCOME_ADJUSTMENT_SOURCE,
        amount: adjustmentAmount,
        category: 'Other Income',
        date: `${selectedMonth}-01`,
        person: memberForEntry,
      }

      return sortByDateDesc([...withoutCurrentAdjustment, adjustmentEntry])
    })

    setIsEditingTotalIncome(false)
    setTotalIncomeInput('')
  }

  function saveRecurringItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !recurringFormState.label.trim() ||
      !recurringFormState.amount.trim() ||
      !recurringFormState.person.trim()
    ) {
      window.alert('Please fill in all recurring item fields.')
      return
    }

    const amount = Number(recurringFormState.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      window.alert('Recurring amount must be a positive number.')
      return
    }

    if (recurringFormState.endDate && recurringFormState.endDate < recurringFormState.startDate) {
      window.alert('End date must be on or after the start date.')
      return
    }

    const existingItem = editingRecurringId
      ? recurringItems.find((item) => item.id === editingRecurringId)
      : undefined

    const nextItem: RecurringItem = {
      id: editingRecurringId || `recurring-${Date.now()}`,
      label: recurringFormState.label.trim(),
      amount,
      kind: recurringFormState.kind,
      frequency: recurringFormState.frequency,
      startDate: recurringFormState.startDate,
      endDate: recurringFormState.endDate || undefined,
      isPaused: recurringFormState.isPaused,
      skippedOccurrences: existingItem?.skippedOccurrences || [],
      person: recurringFormState.person.trim(),
      expenseCategory:
        recurringFormState.kind === 'Expense' ? recurringFormState.expenseCategory : undefined,
      incomeCategory:
        recurringFormState.kind === 'Income' ? recurringFormState.incomeCategory : undefined,
    }

    setRecurringItems((previous) => {
      if (!editingRecurringId) {
        return [...previous, nextItem].sort(
          (left, right) => toDate(left.startDate).getTime() - toDate(right.startDate).getTime(),
        )
      }

      return previous
        .map((item) => (item.id === editingRecurringId ? nextItem : item))
        .sort((left, right) => toDate(left.startDate).getTime() - toDate(right.startDate).getTime())
    })

    resetRecurringForm()
  }

  function deleteExpense(id: string) {
    if (!window.confirm('Delete this expense?')) return
    setExpenses((previous) => previous.filter((expense) => expense.id !== id))
    if (editingExpenseId === id) {
      resetExpenseForm()
    }
  }

  function deleteIncome(id: string) {
    if (!window.confirm('Delete this income entry?')) return
    setIncomes((previous) => previous.filter((income) => income.id !== id))
    if (editingIncomeId === id) {
      resetIncomeForm()
    }
  }

  function deleteRecurringItem(id: string) {
    if (!window.confirm('Delete this recurring item?')) return
    setRecurringItems((previous) => previous.filter((item) => item.id !== id))
    if (editingRecurringId === id) {
      resetRecurringForm()
    }
  }

  function toggleRecurringPaused(id: string) {
    setRecurringItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          isPaused: !item.isPaused,
        }
      }),
    )
  }

  function skipNextOccurrence(itemId: string, occurrenceDates: string[]) {
    const nextOccurrence = occurrenceDates[0]
    if (!nextOccurrence) {
      window.alert('No upcoming occurrence to skip in the selected month.')
      return
    }

    setRecurringItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item

        const skippedOccurrences = new Set(item.skippedOccurrences || [])
        skippedOccurrences.add(nextOccurrence)

        return {
          ...item,
          skippedOccurrences: Array.from(skippedOccurrences).sort(),
        }
      }),
    )

    setToastMessage(`Skipped next occurrence on ${toLocalDate(nextOccurrence)}.`)
  }

  function undoSkippedOccurrence(itemId: string, occurrenceDate: string) {
    setRecurringItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item

        const remainingSkipped = (item.skippedOccurrences || []).filter((date) => date !== occurrenceDate)

        return {
          ...item,
          skippedOccurrences: remainingSkipped.length > 0 ? remainingSkipped : undefined,
        }
      }),
    )

    setToastMessage(`Restored occurrence on ${toLocalDate(occurrenceDate)}.`)
  }

  function beginEditBudget(category: ExpenseCategory) {
    setEditingBudgetCategory(category)
    const budget = budgets.find((item) => item.category === category)
    setBudgetEditAmount(budget?.monthlyLimit.toString() || '')
  }

  function saveBudget() {
    if (!editingBudgetCategory || !budgetEditAmount.trim()) return

    const amount = Number(budgetEditAmount)
    if (Number.isNaN(amount) || amount < 0) {
      window.alert('Budget must be a non-negative number.')
      return
    }

    setBudgets((previous) => {
      return previous.map((budget) => {
        if (budget.category !== editingBudgetCategory) return budget
        return { ...budget, monthlyLimit: amount }
      })
    })

    setEditingBudgetCategory(null)
    setBudgetEditAmount('')
  }

  function exportToCsv() {
    const lines = [
      ['Section', 'Date', 'Label', 'Category', 'Amount', 'Member', 'Details'].join(','),
    ]

    sortByDateDesc(filteredExpenses).forEach((expense) => {
      lines.push(
        [
          'Expense',
          expense.date,
          expense.description,
          expense.category,
          expense.amount.toFixed(2),
          expense.person,
          'One-time',
        ]
          .map((value) => escapeCsvValue(value))
          .join(','),
      )
    })

    sortByDateDesc(filteredIncomes).forEach((income) => {
      lines.push(
        [
          'Income',
          income.date,
          income.source,
          income.category,
          income.amount.toFixed(2),
          income.person,
          'One-time',
        ]
          .map((value) => escapeCsvValue(value))
          .join(','),
      )
    })

    filteredRecurringEntries.forEach((entry) => {
      lines.push(
        [
          `Recurring ${entry.kind}`,
          entry.startDate,
          entry.label,
          entry.kind === 'Expense' ? entry.expenseCategory || 'Other' : entry.incomeCategory || 'Other Income',
          entry.totalAmount.toFixed(2),
          entry.person,
          `${entry.occurrences} ${formatRecurrence(entry.frequency)} occurrence(s)`,
        ]
          .map((value) => escapeCsvValue(value))
          .join(','),
      )
    })

    lines.push('')
    lines.push(['Budget Category', 'Spent', 'Budget', 'Remaining'].join(','))
    budgetStatus.forEach((status) => {
      lines.push(
        [
          status.category,
          status.spent.toFixed(2),
          status.limit.toFixed(2),
          status.remaining.toFixed(2),
        ].join(','),
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `family-budget-${selectedMonth}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="planner-shell">
      <header className="planner-header">
        <div>
          <p className="eyebrow">Household Finance</p>
          <h1>Family Budget & Expense Tracker</h1>
          <p className="subtitle">
            Track spending, income, recurring bills, and household member totals in one monthly view.
          </p>
          <p className="subtitle small-subtitle">Active profile: {activeUser.name}</p>
        </div>
      </header>

      {toastMessage && (
        <div className="inline-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <section className="budget-top-bar" aria-label="Month and member controls">
        <div className="month-selector">
          <label htmlFor="userSelect">User</label>
          <select
            id="userSelect"
            value={activeUser.id}
            onChange={(event) => switchActiveUser(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <button type="button" onClick={() => openUserModal('new')} className="edit-btn">
          New User
        </button>

        <button type="button" onClick={() => openUserModal('rename')} className="ghost-btn">
          Rename User
        </button>

        <button type="button" onClick={() => openUserModal('delete')} className="delete-btn">
          Delete User
        </button>

        <div className="month-selector">
          <label htmlFor="monthSelect">Month</label>
          <select
            id="monthSelect"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {availableMonths.map((month) => {
              const [year, number] = month.split('-')
              const label = new Date(`${year}-${number}-01`).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })

              return (
                <option key={month} value={month}>
                  {label}
                </option>
              )
            })}
          </select>
        </div>

        <div className="month-selector">
          <label htmlFor="memberFilter">Member</label>
          <select
            id="memberFilter"
            value={selectedMember}
            onChange={(event) => setSelectedMember(event.target.value)}
          >
            {memberOptions.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </div>

        <div className="top-bar-info">
          <strong>{monthLabel}</strong>
          <span>
            Income {formatCurrencyValue(totalIncome)} • Spent {formatCurrencyValue(totalSpent)} • Net{' '}
            {formatCurrencyValue(netAmount)}
          </span>
        </div>

        <button type="button" onClick={exportToCsv} className="export-btn">
          Export CSV
        </button>

        <button type="button" onClick={clearCurrentUserData} className="delete-btn">
          Clear Everything
        </button>
      </section>

      <section className="overview-cards">
        <article className="overview-card income">
          <p className="card-label">Total Income</p>
          <p className="card-value">{formatCurrencyValue(totalIncome)}</p>
          <span className="card-meta">including {formatCurrencyValue(totalRecurringIncome)} recurring income</span>
          {selectedIncomeAdjustment && (
            <span className="card-meta">manual adjustment {formatCurrencyValue(selectedIncomeAdjustment.amount)}</span>
          )}
          {isEditingTotalIncome ? (
            <div className="income-edit-controls">
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalIncomeInput}
                onChange={(event) => setTotalIncomeInput(event.target.value)}
                aria-label="Set total income"
              />
              <button type="button" className="edit-btn" onClick={saveTotalIncomeOverride}>
                Save Total
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setIsEditingTotalIncome(false)
                  setTotalIncomeInput('')
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="edit-btn" onClick={beginEditTotalIncome}>
              Edit Total Income
            </button>
          )}
        </article>

        <article className="overview-card total">
          <p className="card-label">Total Spent</p>
          <p className="card-value">{formatCurrencyValue(totalSpent)}</p>
          <span className="card-meta">
            including {formatCurrencyValue(totalRecurringExpense)} recurring expenses against{' '}
            {formatCurrencyValue(totalBudget)} budget
          </span>
        </article>

        <article className={`overview-card ${netAmount >= 0 ? 'remaining' : 'alert'}`}>
          <p className="card-label">Net Cash Flow</p>
          <p className="card-value">{formatCurrencyValue(netAmount)}</p>
          <span className="card-meta">{selectedMember === ALL_MEMBERS ? 'whole household' : selectedMember}</span>
        </article>

        <article className="overview-card transactions">
          <p className="card-label">Tracked Entries</p>
          <p className="card-value">{totalActivityCount}</p>
          <span className="card-meta">one-time and recurring for this month</span>
        </article>

        {overBudgetCategories.length > 0 && (
          <article className="overview-card alert">
            <p className="card-label">Over Budget</p>
            <p className="card-value">{overBudgetCategories.length}</p>
            <span className="card-meta">
              {overBudgetCategories.map((item) => item.category).join(', ')}
            </span>
          </article>
        )}
      </section>

      <section className="reminders-panel" aria-label="Reminders and alarms">
        <div className="panel-header compact">
          <h2>Reminders & Alarm</h2>
          <span>{reminderEntries.length} upcoming</span>
        </div>

        <div className="reminder-controls">
          <label>
            Remind me for the next
            <input
              type="number"
              min="0"
              max="14"
              value={reminderLeadDays}
              onChange={(event) => setReminderLeadDays(Math.min(14, Math.max(0, Number(event.target.value) || 0)))}
            />
            day(s)
          </label>

          <label className="switch-label">
            <input
              type="checkbox"
              checked={alarmEnabled}
              onChange={(event) => setAlarmEnabled(event.target.checked)}
            />
            Alarm sound
          </label>

          <button type="button" className="edit-btn" onClick={enableBrowserNotifications}>
            {notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
          </button>

          <button type="button" className="ghost-btn" onClick={playAlarmTone}>
            Test alarm
          </button>
        </div>

        {activeAlarmText && (
          <div className="alarm-banner" role="status">
            <span>{activeAlarmText}</span>
            <button type="button" className="ghost-btn" onClick={() => setActiveAlarmText(null)}>
              Dismiss
            </button>
          </div>
        )}

        {nextReminder ? (
          <p className="next-reminder">
            Next: <strong>{nextReminder.title}</strong> on {toLocalDate(nextReminder.date)} ({nextReminder.person})
          </p>
        ) : (
          <p className="empty-state">No reminders in your selected window.</p>
        )}

        {reminderEntries.length > 0 && (
          <div className="reminder-list">
            {reminderEntries.map((entry) => (
              <article key={entry.id} className="reminder-item">
                <div>
                  <p className="expense-description">{entry.title}</p>
                  <p className="expense-meta">
                    {entry.type} • {entry.person} • {toLocalDate(entry.date)}
                  </p>
                </div>
                <div className="expense-actions">
                  <p className={`expense-amount ${entry.type === 'Income' ? 'income-amount' : ''}`}>
                    {formatCurrencyValue(entry.amount)}
                  </p>
                  {entry.isRecurring ? <span className="entry-chip">Recurring</span> : <span className="entry-chip">One-time</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="insights-grid" aria-label="Charts and summaries">
        <article className="insight-card">
          <div className="panel-header compact">
            <h2>Category Summary</h2>
            <span>expense mix</span>
          </div>
          {categorySummaryRows.length === 0 ? (
            <p className="empty-state">No spending for the selected filters.</p>
          ) : (
            <div className="chart-with-legend">
              <div className="chart-frame pie-frame">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={2}
                    >
                      {categoryChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatTooltipValue(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="summary-list">
                {categorySummaryRows.map((row) => (
                  <div key={row.category} className="summary-row">
                    <div className="summary-row-header">
                      <span>{row.category}</span>
                      <strong>{formatCurrencyValue(row.amount)}</strong>
                    </div>
                    <div className="summary-bar">
                      <div
                        className="summary-fill"
                        style={{ width: `${row.share}%`, backgroundColor: getCategoryColor(row.category) }}
                      />
                    </div>
                    <small>{row.share}% of monthly spending</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="insight-card">
          <div className="panel-header compact">
            <h2>Cash Flow Chart</h2>
            <span>income vs spend</span>
          </div>
          <div className="chart-frame" role="img" aria-label="Cash flow bar chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cashFlowChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe3ee" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyValue(value)} />
                <Tooltip formatter={(value) => formatTooltipValue(value)} />
                <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                  {cashFlowChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="insight-card">
          <div className="panel-header compact">
            <h2>Household Member Totals</h2>
            <span>per member</span>
          </div>
          {memberTotals.length === 0 ? (
            <p className="empty-state">No member totals available for this month.</p>
          ) : (
            <div className="chart-with-legend">
              <div className="chart-frame member-chart-frame">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={memberChartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe3ee" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyValue(value)} />
                    <Tooltip formatter={(value) => formatTooltipValue(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="spent" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="member-summary-list">
                {memberTotals.map((row) => (
                  <article key={row.member} className="member-card">
                    <div>
                      <p className="member-name">{row.member}</p>
                      <p className="member-meta">
                        Income {formatCurrencyValue(row.income)} • Spent {formatCurrencyValue(row.spent)}
                      </p>
                    </div>
                    <strong className={row.net >= 0 ? 'net-positive' : 'net-negative'}>
                      {formatCurrencyValue(row.net)}
                    </strong>
                  </article>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="budget-panel" aria-label="Budget breakdown by category">
        <h2>Budget by Category</h2>
        <div className="budget-list">
          {budgetStatus.map((status) => (
            <article
              key={status.category}
              className={`budget-item ${status.isOverBudget ? 'over-budget' : ''}`}
            >
              <div className="budget-header">
                <p className="budget-category">{status.category}</p>
                {editingBudgetCategory === status.category ? (
                  <div className="budget-edit">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetEditAmount}
                      onChange={(event) => setBudgetEditAmount(event.target.value)}
                    />
                    <button type="button" onClick={saveBudget} className="save-btn">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBudgetCategory(null)}
                      className="ghost-btn"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => beginEditBudget(status.category)}
                    className="edit-budget-btn"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="budget-bar">
                <div
                  className="budget-progress"
                  style={{
                    width: `${Math.min(100, status.percentUsed)}%`,
                    backgroundColor: getCategoryColor(status.category),
                  }}
                />
              </div>

              <p className="budget-detail">
                <span>{formatCurrencyValue(status.spent)}</span>
                <strong>/</strong>
                <span>{formatCurrencyValue(status.limit)}</span>
                <span className={status.isOverBudget ? 'over' : 'remaining'}>
                  {status.isOverBudget
                    ? `Over by ${formatCurrencyValue(Math.abs(status.remaining))}`
                    : `${formatCurrencyValue(status.remaining)} left`}
                </span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="ledger-grid" aria-label="Monthly activity">
        <section className="expenses-panel">
          <div className="panel-header">
            <h2>Expense Activity</h2>
            <span>{filteredExpenses.length + recurringExpenseEntries.length} items</span>
          </div>

          <div className="expense-list">
            {filteredExpenses.length === 0 && recurringExpenseEntries.length === 0 ? (
              <p className="empty-state">No expenses recorded for {monthLabel}.</p>
            ) : (
              <>
                {sortByDateDesc(filteredExpenses).map((expense) => (
                  <article key={expense.id} className="expense-row">
                    <div className="expense-content">
                      <div
                        className="category-dot"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      />
                      <div>
                        <p className="expense-description">{expense.description}</p>
                        <p className="expense-meta">
                          {expense.category} • {expense.person} • {toLocalDate(expense.date)}
                        </p>
                      </div>
                    </div>

                    <div className="expense-actions">
                      <p className="expense-amount">{formatCurrencyValue(expense.amount)}</p>
                      <button type="button" className="edit-btn" onClick={() => beginEditExpense(expense)}>
                        Edit
                      </button>
                      <button type="button" className="delete-btn" onClick={() => deleteExpense(expense.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {recurringExpenseEntries.map((entry) => (
                  <article key={entry.id} className="expense-row recurring-row">
                    <div className="expense-content">
                      <div
                        className="category-dot"
                        style={{ backgroundColor: getCategoryColor(entry.expenseCategory || 'Other') }}
                      />
                      <div>
                        <p className="expense-description">{entry.label}</p>
                        <p className="expense-meta">
                          {entry.expenseCategory || 'Other'} • {entry.person} • {entry.occurrences} {formatRecurrence(entry.frequency)} occurrence(s)
                        </p>
                      </div>
                    </div>

                    <div className="expense-actions">
                      <p className="expense-amount">{formatCurrencyValue(entry.totalAmount)}</p>
                      <span className="entry-chip">Recurring</span>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="expenses-panel">
          <div className="panel-header">
            <h2>Income Activity</h2>
            <span>{filteredIncomes.length + recurringIncomeEntries.length} items</span>
          </div>

          <div className="expense-list">
            {filteredIncomes.length === 0 && recurringIncomeEntries.length === 0 ? (
              <p className="empty-state">No income recorded for {monthLabel}.</p>
            ) : (
              <>
                {sortByDateDesc(filteredIncomes).map((income) => (
                  <article key={income.id} className="expense-row">
                    <div className="expense-content">
                      <div
                        className="category-dot"
                        style={{ backgroundColor: getIncomeColor(income.category) }}
                      />
                      <div>
                        <p className="expense-description">{income.source}</p>
                        <p className="expense-meta">
                          {income.category} • {income.person} • {toLocalDate(income.date)}
                        </p>
                      </div>
                    </div>

                    <div className="expense-actions">
                      <p className="expense-amount income-amount">{formatCurrencyValue(income.amount)}</p>
                      <button type="button" className="edit-btn" onClick={() => beginEditIncome(income)}>
                        Edit
                      </button>
                      <button type="button" className="delete-btn" onClick={() => deleteIncome(income.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {recurringIncomeEntries.map((entry) => (
                  <article key={entry.id} className="expense-row recurring-row">
                    <div className="expense-content">
                      <div
                        className="category-dot"
                        style={{ backgroundColor: getIncomeColor(entry.incomeCategory || 'Other Income') }}
                      />
                      <div>
                        <p className="expense-description">{entry.label}</p>
                        <p className="expense-meta">
                          {entry.incomeCategory || 'Other Income'} • {entry.person} • {entry.occurrences} {formatRecurrence(entry.frequency)} occurrence(s)
                        </p>
                      </div>
                    </div>

                    <div className="expense-actions">
                      <p className="expense-amount income-amount">{formatCurrencyValue(entry.totalAmount)}</p>
                      <span className="entry-chip income-chip">Recurring</span>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>
        </section>
      </section>

      <section className="forms-grid" aria-label="Create and edit forms">
        <section className="form-panel">
          <div className="panel-header">
            <h2>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h2>
            <span>one-time expense</span>
          </div>

          <form className="expense-form" onSubmit={saveExpense}>
            <label>
              Description
              <input
                value={expenseFormState.description}
                onChange={(event) => updateExpenseForm('description', event.target.value)}
                placeholder="e.g., Weekly groceries"
                required
              />
            </label>

            <label>
              Amount (FCFA)
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseFormState.amount}
                onChange={(event) => updateExpenseForm('amount', event.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label>
              Category
              <select
                value={expenseFormState.category}
                onChange={(event) => updateExpenseForm('category', event.target.value as ExpenseCategory)}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={expenseFormState.date}
                onChange={(event) => updateExpenseForm('date', event.target.value)}
                required
              />
            </label>

            <label>
              Household Member
              <input
                value={expenseFormState.person}
                onChange={(event) => updateExpenseForm('person', event.target.value)}
                placeholder="e.g., Mom"
                required
              />
            </label>

            <div className="form-actions">
              <button type="submit">{editingExpenseId ? 'Update Expense' : 'Add Expense'}</button>
              <button type="button" className="ghost-btn" onClick={resetExpenseForm}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="form-panel">
          <div className="panel-header">
            <h2>{editingIncomeId ? 'Edit Income' : 'Add Income'}</h2>
            <span>one-time income</span>
          </div>

          <form className="expense-form" onSubmit={saveIncome}>
            <label>
              Source
              <input
                value={incomeFormState.source}
                onChange={(event) => updateIncomeForm('source', event.target.value)}
                placeholder="e.g., Salary"
                required
              />
            </label>

            <label>
              Amount (FCFA)
              <input
                type="number"
                min="0"
                step="0.01"
                value={incomeFormState.amount}
                onChange={(event) => updateIncomeForm('amount', event.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label>
              Category
              <select
                value={incomeFormState.category}
                onChange={(event) => updateIncomeForm('category', event.target.value as IncomeCategory)}
              >
                {INCOME_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={incomeFormState.date}
                onChange={(event) => updateIncomeForm('date', event.target.value)}
                required
              />
            </label>

            <label>
              Household Member
              <input
                value={incomeFormState.person}
                onChange={(event) => updateIncomeForm('person', event.target.value)}
                placeholder="e.g., Dad"
                required
              />
            </label>

            <div className="form-actions">
              <button type="submit">{editingIncomeId ? 'Update Income' : 'Add Income'}</button>
              <button type="button" className="ghost-btn" onClick={resetIncomeForm}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="form-panel recurring-panel">
          <div className="panel-header">
            <h2>{editingRecurringId ? 'Edit Recurring Item' : 'Add Recurring Item'}</h2>
            <span>expense or income</span>
          </div>

          <form className="expense-form" onSubmit={saveRecurringItem}>
            <label>
              Type
              <select
                value={recurringFormState.kind}
                onChange={(event) => updateRecurringForm('kind', event.target.value as RecurringKind)}
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </label>

            <label>
              Label
              <input
                value={recurringFormState.label}
                onChange={(event) => updateRecurringForm('label', event.target.value)}
                placeholder="e.g., Rent"
                required
              />
            </label>

            <label>
              Amount (FCFA)
              <input
                type="number"
                min="0"
                step="0.01"
                value={recurringFormState.amount}
                onChange={(event) => updateRecurringForm('amount', event.target.value)}
                placeholder="0.00"
                required
              />
            </label>

            <label>
              Frequency
              <select
                value={recurringFormState.frequency}
                onChange={(event) => updateRecurringForm('frequency', event.target.value as Recurrence)}
              >
                {RECURRENCE_OPTIONS.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Start Date
              <input
                type="date"
                value={recurringFormState.startDate}
                onChange={(event) => updateRecurringForm('startDate', event.target.value)}
                required
              />
            </label>

            <label>
              End Date (optional)
              <input
                type="date"
                value={recurringFormState.endDate}
                onChange={(event) => updateRecurringForm('endDate', event.target.value)}
              />
            </label>

            <label className="switch-label">
              <input
                type="checkbox"
                checked={recurringFormState.isPaused}
                onChange={(event) => updateRecurringForm('isPaused', event.target.checked)}
              />
              Paused
            </label>

            <label>
              Household Member
              <input
                value={recurringFormState.person}
                onChange={(event) => updateRecurringForm('person', event.target.value)}
                placeholder="e.g., Family"
                required
              />
            </label>

            {recurringFormState.kind === 'Expense' ? (
              <label>
                Expense Category
                <select
                  value={recurringFormState.expenseCategory}
                  onChange={(event) => updateRecurringForm('expenseCategory', event.target.value as ExpenseCategory)}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Income Category
                <select
                  value={recurringFormState.incomeCategory}
                  onChange={(event) => updateRecurringForm('incomeCategory', event.target.value as IncomeCategory)}
                >
                  {INCOME_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="form-actions">
              <button type="submit">{editingRecurringId ? 'Update Recurring' : 'Add Recurring'}</button>
              <button type="button" className="ghost-btn" onClick={resetRecurringForm}>
                Clear
              </button>
            </div>
          </form>
        </section>
      </section>

      <section className="budget-panel" aria-label="Recurring items list">
        <div className="panel-header">
          <h2>Recurring Plans</h2>
          <span>{recurringItems.length} scheduled items</span>
        </div>
        <div className="budget-list">
          {recurringItems.map((item) => {
            const monthlyImpact = recurringEntriesForMonth.find((entry) => entry.id === item.id)
            const selectedMonthStart = new Date(`${selectedMonth}-01T00:00:00`)
            const selectedMonthEnd = new Date(
              selectedMonthStart.getFullYear(),
              selectedMonthStart.getMonth() + 1,
              0,
            )
            const remainingDatesInMonth = getRecurringOccurrencesInRange(item, selectedMonthStart, selectedMonthEnd)
            const skippedDates = [...(item.skippedOccurrences || [])].sort()

            return (
              <article key={item.id} className="budget-item recurring-item-card">
                <div className="budget-header">
                  <div>
                    <p className="budget-category">{item.label}</p>
                    <p className="expense-meta">
                      {item.kind} • {item.person} • starts {toLocalDate(item.startDate)}
                    </p>
                  </div>
                  <div className="expense-actions">
                    <button type="button" className="edit-btn" onClick={() => beginEditRecurring(item)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => toggleRecurringPaused(item.id)}
                    >
                      {item.isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => skipNextOccurrence(item.id, remainingDatesInMonth)}
                      disabled={remainingDatesInMonth.length === 0 || !!item.isPaused}
                    >
                      Skip Next
                    </button>
                    <button type="button" className="delete-btn" onClick={() => deleteRecurringItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
                <p className="budget-detail recurring-detail">
                  <span>{formatCurrencyValue(item.amount)}</span>
                  <span>{formatRecurrence(item.frequency)}</span>
                  <span>
                    {item.kind === 'Expense'
                      ? item.expenseCategory || 'Other'
                      : item.incomeCategory || 'Other Income'}
                  </span>
                  <span>{item.endDate ? `ends ${toLocalDate(item.endDate)}` : 'no end date'}</span>
                  <span>{item.isPaused ? 'paused' : 'active'}</span>
                  <span>
                    {monthlyImpact
                      ? `${monthlyImpact.occurrences} hit(s) this month, ${formatCurrencyValue(monthlyImpact.totalAmount)} total`
                      : 'No occurrence in selected month'}
                  </span>
                </p>
                {skippedDates.length > 0 && (
                  <div className="reminder-list">
                    {skippedDates.map((date) => (
                      <div key={`${item.id}-${date}`} className="expense-actions">
                        <span className="entry-chip">Skipped {toLocalDate(date)}</span>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => undoSkippedOccurrence(item.id, date)}
                        >
                          Undo Skip
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {userModalMode && (
        <div className="modal-backdrop" role="presentation" onClick={closeUserModal}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="userModalTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="userModalTitle">
              {userModalMode === 'new' && 'Create New User'}
              {userModalMode === 'rename' && 'Rename User'}
              {userModalMode === 'delete' && 'Delete User'}
            </h3>

            <p className="modal-copy">
              {userModalMode === 'new' && 'Create a separate profile with its own expenses, income, and reminders.'}
              {userModalMode === 'rename' && 'Change the profile name without losing its data.'}
              {userModalMode === 'delete' && `Delete ${activeUser.name} and all profile data. This cannot be undone.`}
            </p>

            {(userModalMode === 'new' || userModalMode === 'rename') && (
              <label className="modal-input-wrap">
                User name
                <input
                  value={userModalInput}
                  onChange={(event) => {
                    setUserModalInput(event.target.value)
                    if (userModalError) setUserModalError('')
                  }}
                  placeholder="Enter user name"
                  autoFocus
                />
              </label>
            )}

            {userModalError && <p className="modal-error">{userModalError}</p>}

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeUserModal}>
                Cancel
              </button>
              <button
                type="button"
                className={userModalMode === 'delete' ? 'delete-btn' : 'edit-btn'}
                onClick={submitUserModal}
              >
                {userModalMode === 'new' && 'Create User'}
                {userModalMode === 'rename' && 'Save Name'}
                {userModalMode === 'delete' && 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
