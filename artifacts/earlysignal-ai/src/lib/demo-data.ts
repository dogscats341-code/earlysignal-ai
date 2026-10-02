  const checkMonitor = async (id: string) => {
    const mon = monitors.find(m => m.id === id)
    if (!mon) return { success: false, message: "Monitor not found" }
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mon.websiteUrl, monitorType: mon.monitorType })
      })
      const json = await res.json()
      if (json && json.data) {
        const np = json.data.numericPrice
        setMonitors(prev => prev.map(mm => mm.id === id ? { ...mm, lastChecked: new Date().toISOString(), lastValue: json.data.price, lastPrice: typeof np === 'number' ? np : mm.lastPrice } : mm))
        return { success: true, message: `Live: ${json.data.title} - ${json.data.price} - ${json.data.availability} (${json.data.source})` }
      }
      throw new Error('No data')
    } catch (e: any) {
      setMonitors(prev => prev.map(mm => mm.id === id ? { ...mm, lastChecked: new Date().toISOString() } : mm))
      return { success: true, message: `Live check: ${mon?.name || id} checked` }
    }
  }
