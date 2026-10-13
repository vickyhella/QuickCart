export async function readJSONResponse(response: Response) {
  const text = await response.text()
  let data: any = {}
  if (!text) throw new Error(`Server returned an invalid response (${response.status}).`)
  try { data = JSON.parse(text) } catch { throw new Error(`Server returned an invalid response (${response.status}).`) }
  if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status}).`)
  return data
}
