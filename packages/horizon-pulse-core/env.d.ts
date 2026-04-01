interface ImportMeta {
  readonly hot?: {
    on: (event: string, callback: (data: any) => void) => void
  }
}
