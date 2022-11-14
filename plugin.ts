import type { PluginContext } from '@rcv-prod-toolkit/types'
import axios, { AxiosError } from 'axios'

module.exports = async (ctx: PluginContext) => {
  const namespace = ctx.plugin.module.getName()

  // Register new UI page
  ctx.LPTE.emit({
    meta: {
      type: 'add-pages',
      namespace: 'ui',
      version: 1
    },
    pages: [
      {
        name: `vMix`,
        frontend: 'frontend',
        id: `op-${namespace}`
      }
    ]
  })

  const configRes = await ctx.LPTE.request({
    meta: {
      type: 'request',
      namespace: 'plugin-config',
      version: 1
    }
  })
  if (configRes === undefined) {
    ctx.log.warn('config could not be loaded')
  }
  let config = Object.assign({
    ip: '127.0.0.1',
    port: 8088
  }, configRes?.config)

  ctx.LPTE.on(namespace, 'set-settings', async (e) => {
    config.ip = e.ip,
    config.port = e.port

    ctx.LPTE.emit({
      meta: {
        type: 'set',
        namespace: 'plugin-config',
        version: 1
      },
      config: {
        ip: config.ip,
        port: config.port
      }
    })
  })

  ctx.LPTE.on(namespace, 'get-settings', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply!,
        namespace: 'reply',
        version: 1
      },
      ip: config.ip,
      port: config.port
    })
  })

  async function executeFunc(func: string): Promise<void> {
    try {
      ctx.log.debug(`Executing function ${func}`)
      await axios.get(`http://${config.ip}:${config.port}/api/?${func}`)
    } catch (error) {
      const e = error as AxiosError
      ctx.log.error(`Function could not be executed ${e.response?.status ?? 404}: ${e.response?.statusText ?? 'vMix could not be reached'}`)
    }
  }

  ctx.LPTE.on(namespace, 'delete', async (e: any) => {
    await ctx.LPTE.request({
      meta: {
        type: 'deleteOne',
        namespace: 'plugin-database',
        version: 1
      },
      collection: 'vmix',
      id: e.id
    })

    ctx.LPTE.unregister(namespace, e.listener)

    const res = await ctx.LPTE.request({
      meta: {
        type: 'request',
        namespace: 'plugin-database',
        version: 1
      },
      collection: 'vmix',
      limit: 30
    })

    if (res === undefined || res.data === undefined) {
      ctx.log.warn('vmix functions could not be loaded')
    }

    ctx.LPTE.emit({
      meta: {
        type: 'update-vmix-set',
        namespace,
        version: 1
      },
      functions: res?.data
    })
  })

  ctx.LPTE.on(namespace, 'add', async (e: any) => {
    await ctx.LPTE.request({
      meta: {
        type: 'insertOne',
        namespace: 'plugin-database',
        version: 1
      },
      collection: 'vmix',
      data: {
        listener: e.listener,
        function: e.function,
      }
    })

    ctx.LPTE.on(namespace, e.listener, async () => {
      await executeFunc(e.function)
    })

    const res = await ctx.LPTE.request({
      meta: {
        type: 'request',
        namespace: 'plugin-database',
        version: 1
      },
      collection: 'vmix',
      limit: 30
    })

    if (res === undefined || res.data === undefined) {
      ctx.log.warn('vmix functions could not be loaded')
    }

    ctx.LPTE.emit({
      meta: {
        type: 'update-vmix-set',
        namespace,
        version: 1
      },
      functions: res?.data
    })
  })

  ctx.LPTE.on(namespace, 'request', async (e: any) => {
    const res = await ctx.LPTE.request({
      meta: {
        type: 'request',
        namespace: 'plugin-database',
        version: 1
      },
      collection: 'vmix',
      limit: 30
    })

    if (res === undefined || res.data === undefined) {
      ctx.log.warn('vmix functions could not be loaded')
    }

    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply,
        namespace: 'reply',
        version: 1
      },
      functions: res?.data
    })
  })

  // Emit event that we're ready to operate
  ctx.LPTE.emit({
    meta: {
      type: 'plugin-status-change',
      namespace: 'lpt',
      version: 1
    },
    status: 'RUNNING'
  })

  const res = await ctx.LPTE.request({
    meta: {
      type: 'request',
      namespace: 'plugin-database',
      version: 1
    },
    collection: 'vmix',
    limit: 30
  })

  if (res === undefined || res.data === undefined) {
    return ctx.log.warn('vmix functions could not be loaded')
  }

  res.data.forEach((f: any) => {
    ctx.LPTE.on(namespace, f.listener, async () => {
      await executeFunc(f.function)
    })
  });
}
