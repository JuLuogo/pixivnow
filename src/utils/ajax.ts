import nprogress from 'nprogress'

const createAjax = () => {
  const fetchWithInterceptor = async (
    url: string,
    options?: RequestInit,
  ): Promise<Response> => {
    nprogress.start()
    try {
      const response = await fetch(url, options)
      return response
    } catch (error) {
      return Promise.reject(error)
    } finally {
      nprogress.done()
    }
  }

  return {
    get: (url: string, options?: RequestInit) =>
      fetchWithInterceptor(url, { ...options, method: 'GET' }),
    post: (url: string, body?: any, options?: RequestInit) =>
      fetchWithInterceptor(url, {
        ...options,
        method: 'POST',
        body: body,
      }),
  }
}

export const ajax = createAjax()

export const ajaxPostWithFormData = (
  url: string,
  data:
    | string
    | string[][]
    | Record<string, string>
    | URLSearchParams
    | undefined,
  config?: RequestInit,
) => {
  return ajax.post(url, new URLSearchParams(data).toString(), {
    ...config,
    headers: {
      ...(config?.headers || {}),
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
  })
}
