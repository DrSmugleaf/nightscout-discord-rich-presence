import DiscordRPC from 'discord-rpc'
import { IConfig } from './config'
import {
  RPC_CLIENT_ID,
  RPC_IMG_NIGHTSCOUT_LOGO,
  RPC_STR_DETAIL,
  UNIT_MGDL,
  UNIT_MMOL
} from './constants'
import { IParsedData } from './nightscout'

DiscordRPC.register(RPC_CLIENT_ID)
const rpc = new DiscordRPC.Client({ transport: 'ipc' })

export const rpcReady = new Promise(resolve => {
  rpc.on('ready', () => resolve())
})

export const setActivity = (data: IParsedData, config: IConfig) => {
  const state = `${data.mgdl} ${UNIT_MGDL} | ${data.mmol} ${UNIT_MMOL}`

  rpc.setActivity({
    details: config.displayNightscoutSite ? config.siteUrl : RPC_STR_DETAIL + ` (${data.direction})`,
    largeImageKey: RPC_IMG_NIGHTSCOUT_LOGO,
    largeImageText: state,
    smallImageKey: (data.alert && data.alert.image) || undefined,
    smallImageText: (data.alert && data.alert.text) || undefined,
    state,
  })
}

rpc.login({ clientId: RPC_CLIENT_ID })
