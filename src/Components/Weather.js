/* eslint-disable react/prop-types */
/* eslint-disable no-console */

import React, { PureComponent } from 'react'
import { compose } from 'recompose'
import axios from 'axios'

import getUserLocation from '../Libs/getUserLocation'
import Temperature from './Temperature'
import { showWeather, findWeather } from '../Libs/background'
import apiKey from '../key-info/apixu.js'

/**
 * The main weather component.
 *
 * This component attempts to read the GPS browser location, which
 * is subsequently used to retrieve and display weather data for
 * the user's current location.
 * If the GPS location cannot be determined, a static location is
 * used (for demonstration purposes) instead.
 *
 * @class Weather
 * @extends {PureComponent}
 */
class Weather extends PureComponent {
  state = {
    isLoading: true,
    location: {},
    temperatures: {},
    condition: {},
    isCelsius: true,
  }
  componentWillMount = () => {
    // start updating weather data
    this.loadWeatherData()
    this.timer = setInterval(this.loadWeatherData, 30 * 60 * 1000)
  }
  componentWillUnmount = () => {
    clearInterval(this.timer)
  }
  getUrl = apiKey => (lat, long) => {
    return `https://api.apixu.com/v1/current.json?key=${apiKey}&q=${lat},${long}`
  }
  updateWithWeatherData = async (latitude, longitude) => {
    const weatherDataForGPS = this.getUrl(apiKey)
    const weatherServerUrl = weatherDataForGPS(latitude, longitude)
    // fetch weather data
    try {
      const {
        data: { location, current },
      } = await axios.get(weatherServerUrl)
      const { temp_c, temp_f, condition } = current
      const { icon, text } = condition
      // update background image
      showWeather(findWeather(text))
      this.setState({
        isLoading: false,
        location,
        temperatures: { celsius: temp_c, fahrenheit: temp_f },
        condition,
        icon: 'https:' + icon,
      })
    } catch (err) {
      console.error('Fetch failure', err)
    }
  }
  loadWeatherData = async () => {
    try {
      const { latitude, longitude } = await getUserLocation()
      this.updateWithWeatherData(latitude, longitude)
    } catch (error) {
      // User denied Geolocation so use static location
      // const [latitude, longitude] = [55.9485947, -3.1999135] // Edinburgh
      // const [latitude, longitude] = [48.856614, 2.3522219000000177] // Paris
      const [latitude, longitude] = [60.192059, 24.945831] // Helsinki
      this.updateWithWeatherData(latitude, longitude)
      console.warn('Location Warning, reason:', error.message)
    }
  }
  toggleTemperatureScale = () => {
    this.setState({
      isCelsius: !this.state.isCelsius,
    })
  }
  render() {
    const {
      condition,
      isCelsius,
      temperatures,
      location,
      isLoading,
      icon,
    } = this.state
    const { name } = location
    const { text } = condition
    return (
      <TemperatureWithLoading
        onClick={this.toggleTemperatureScale}
        isLoading={isLoading}
        location={name}
        temperature={isCelsius ? temperatures.celsius : temperatures.fahrenheit}
        text={text}
        isCelsius={isCelsius}
        icon={icon}
      />
    )
  }
}

// For fun let's use some Higher Order Components
// See https://www.robinwieruch.de/gentle-introduction-higher-order-components/
const withLoading = Component => props => (
  <div style={mainStyles}>
    {props.isLoading ? <span>Loading...</span> : <Component {...props} />}
  </div>
)

const Panel = props => (
  <div style={weatherStyles}>
    <Temperature {...props} />
  </div>
)

const TemperatureWithLoading = compose(withLoading)(Panel)

let mainStyles = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

let weatherStyles = {
  width: '300px',
  height: 'auto',
  border: '1px solid #fdb',
  borderRadius: '3%',
  backgroundColor: 'rgba(255, 255, 221,0.5)',
}

export default Weather
