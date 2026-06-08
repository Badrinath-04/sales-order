export const DEFAULT_FILTERS = {
  search: '',
  date: 'today',
  customDateFrom: '',
  customDateTo: '',
  class: '',
  status: '',
  method: '',
  dueSort: 'desc',
}

/**
 * Restore transactions list UI state from URL search params (survives detail view + back).
 */
export function parseTransactionListState(searchParams, { defaultBranch = 'all' } = {}) {
  const get = (key) => searchParams.get(key)

  const filters = {
    search: get('q') ?? DEFAULT_FILTERS.search,
    date: get('date') ?? DEFAULT_FILTERS.date,
    customDateFrom: get('from') ?? DEFAULT_FILTERS.customDateFrom,
    customDateTo: get('to') ?? DEFAULT_FILTERS.customDateTo,
    class: get('class') ?? DEFAULT_FILTERS.class,
    status: get('status') ?? DEFAULT_FILTERS.status,
    method: get('method') ?? DEFAULT_FILTERS.method,
    dueSort: get('dueSort') ?? DEFAULT_FILTERS.dueSort,
  }

  const page = Math.max(1, Number.parseInt(get('page') ?? '1', 10) || 1)
  const activeTab = get('tab') === 'dues' ? 'dues' : 'transactions'
  const viewMode = get('view') === 'students' ? 'students' : 'transactions'
  const branchParam = get('branch')
  const selectedBranchFilter = branchParam ?? defaultBranch

  return {
    filters: { ...filters },
    appliedFilters: { ...filters },
    page,
    activeTab,
    viewMode,
    selectedBranchFilter,
  }
}

/**
 * Serialize applied list state into URL search params (omit defaults to keep URLs short).
 */
export function buildTransactionListSearchParams({
  appliedFilters,
  page = 1,
  activeTab = 'transactions',
  viewMode = 'transactions',
  selectedBranchFilter,
  defaultBranch = 'all',
  canSwitchBranches = false,
}) {
  const params = new URLSearchParams()

  if (appliedFilters.search) params.set('q', appliedFilters.search)
  if (appliedFilters.date && appliedFilters.date !== DEFAULT_FILTERS.date) {
    params.set('date', appliedFilters.date)
  }
  if (appliedFilters.customDateFrom) params.set('from', appliedFilters.customDateFrom)
  if (appliedFilters.customDateTo) params.set('to', appliedFilters.customDateTo)
  if (appliedFilters.class) params.set('class', appliedFilters.class)
  if (appliedFilters.status) params.set('status', appliedFilters.status)
  if (appliedFilters.method) params.set('method', appliedFilters.method)
  if (appliedFilters.dueSort && appliedFilters.dueSort !== DEFAULT_FILTERS.dueSort) {
    params.set('dueSort', appliedFilters.dueSort)
  }
  if (activeTab === 'dues') params.set('tab', 'dues')
  if (viewMode === 'students') params.set('view', 'students')
  if (page > 1) params.set('page', String(page))

  if (canSwitchBranches) {
    if (selectedBranchFilter === 'all') {
      params.set('branch', 'all')
    } else if (selectedBranchFilter && selectedBranchFilter !== defaultBranch) {
      params.set('branch', selectedBranchFilter)
    }
  }

  return params
}

export function transactionListReturnPath(pathname, search) {
  const query = search?.startsWith('?') ? search.slice(1) : (search ?? '')
  return query ? `${pathname}?${query}` : pathname
}
