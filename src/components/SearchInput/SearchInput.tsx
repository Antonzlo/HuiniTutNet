import { FormEvent, useState } from 'react'
import { SearchIcon } from '@/components/icons'
import styles from './SearchInput.module.scss'

interface SearchInputProps {
  onSearch: (query: string) => void
  placeholder?: string
  searching?: boolean
}

export function SearchInput({ onSearch, placeholder = 'Search', searching }: SearchInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed && !searching) onSearch(trimmed)
  }

  return (
    <form className={styles.search} onSubmit={handleSubmit}>
      <SearchIcon size={20} />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
        disabled={searching}
        autoComplete="off"
      />
      {searching && <span className={styles.spinner} aria-hidden />}
    </form>
  )
}
