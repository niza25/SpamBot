import { DATA_FOR_CLASS_FETCHED } from '../actions/data'

const initialState = [];

export default (state = initialState, action = {}) => {
  switch (action.type) {
    case DATA_FOR_CLASS_FETCHED:
    const payload = action.data;
    const data = [
      {
          name: payload.Energy[0].response_time, Energy: Number(payload.Energy[0].avg).toFixed(1) , Engagement: Number(payload.Engagement[0].avg).toFixed(1), Happiness: Number(payload.Happiness[0].avg).toFixed(1),
      },
      {
          name: 'Tuesday', Energy: 4.5, Engagement: 4.3, Happiness: 4.5,
      },
      {
          name: 'Wednesday', Energy: 3.6, Engagement: 4.2, Happiness: 4.6,
      },
      {
          name: 'Thursday', Energy: 5, Engagement: 3.8, Happiness: 4.2,
      },
      {
          name: 'Friday', Energy: 4.8, Engagement: 4, Happiness: 4.2,
      }
  ]
  console.log(data, 'data')
  console.log(action.data, 'action.data')
      return data;
    default:
      return state
  }
}