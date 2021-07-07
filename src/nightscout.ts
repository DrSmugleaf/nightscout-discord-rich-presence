import axios from './axios'
import { IConfig } from './config'
import {
  ARROW_DOUBLE_DOWN,
  ARROW_DOUBLE_UP,
  ARROW_FLAT,
  ARROW_FORTY_FIVE_DOWN,
  ARROW_FORTY_FIVE_UP,
  ARROW_NONE,
  ARROW_NOT_COMPUTABLE,
  ARROW_RATE_OUT_OF_RANGE,
  ARROW_SINGLE_DOWN,
  ARROW_SINGLE_UP,
  MULTIPLIER_MMOL,
  RPC_IMG_HIGH,
  RPC_IMG_LOW,
  RPC_STR_HIGH_ALERT,
  RPC_STR_LOW_ALERT,
  UNIT_MGDL,
  UNIT_MMOL,
} from './constants'
import log from './log'

export interface INightscoutData {
  _id: string
  device: string
  dateString: string
  glucose: number
  delta: number
  direction: string
  type: string
  filtered: number
  unfiltered: number
  rssi: number
  noise: number
  systime: string
}

export const fetchInfo = async (baseURL: string) => {
  try {
    const resp = await axios.get<INightscoutData[]>(
      '/api/v1/treatments',
      { baseURL }
    )

    return resp.data[0]
  } catch (err) {
    log.error('Could not contact Nightscout server!')
    log.error('Please check `siteUrl` in your config.', 0)

    throw err
  }
}

export const mgdlToMmol = (mgdl: number) => mgdl / MULTIPLIER_MMOL
export const mmolToMgdl = (mmol: number) => mmol * MULTIPLIER_MMOL

export const directionArrow = (direction: string) => {
  const dir = direction.toUpperCase()
  switch (dir) {
    case 'NONE':
      return ARROW_NONE
    case 'DOUBLEDOWN':
      return ARROW_DOUBLE_DOWN
    case 'DOWN':
      return ARROW_SINGLE_DOWN
    case 'HALFDOWN':
      return ARROW_FORTY_FIVE_DOWN
    case 'FLAT':
      return ARROW_FLAT
    case 'HALFUP':
      return ARROW_FORTY_FIVE_UP
    case 'UP':
      return ARROW_SINGLE_UP
    case 'DOUBLEUP':
      return ARROW_DOUBLE_UP
    default:
      return ''
  }
}

export const humanUnits = (unit: IConfig['units']) =>
  unit === 'mgdl' ? UNIT_MGDL : UNIT_MMOL

export interface IParsedData {
  direction: string
  mgdl: string
  mmol: string

  alert?: IAlert
}

interface IAlert {
  type: 'low' | 'high'

  text: string
  image: string
}

export const parseData = (data: INightscoutData, config: IConfig) => {
  const isMmol = config.units === 'mmol'
  const lowerBound = isMmol ? mgdlToMmol(config.lowValue) : config.lowValue
  const upperBound = isMmol ? mgdlToMmol(config.highValue) : config.highValue

  const rawUnits = isMmol ? mgdlToMmol(data.glucose) : data.glucose
  const units = rawUnits.toFixed(0)
  const mmolUnits = (isMmol ? rawUnits : mgdlToMmol(units)).toFixed(1)

  const parsed: IParsedData = {
    direction: directionArrow(data.notes),
    mgdl: units,
    mmol: mmolUnits
  }

  if (rawUnits <= lowerBound) {
    parsed.alert = {
      image: RPC_IMG_LOW,
      text: RPC_STR_LOW_ALERT,
      type: 'low',
    }
  } else if (rawUnits >= upperBound) {
    parsed.alert = {
      image: RPC_IMG_HIGH,
      text: RPC_STR_HIGH_ALERT,
      type: 'high',
    }
  }

  return parsed
}
