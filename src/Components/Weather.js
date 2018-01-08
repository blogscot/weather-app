/* eslint-disable react/prop-types */
/* eslint-disable no-console */

import React, { PureComponent } from 'react'
import { compose } from 'recompose'
import axios from 'axios'

import getUserLocation from '../Libs/getUserLocation'
import Temperature from './Temperature'
import { toFahrenheit } from '../Libs/pure-functions'
import apiKey from '../key-info/apixu'

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
    temperature: 0,
    condition: {},
    isCelsius: true,
  }
  componentDidMount = () => {
    // start updating weather data
    this.loadWeatherData()
    this.timer = setInterval(this.loadWeatherData, 300000)
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
      const { data } = await axios.get(weatherServerUrl)
      this.setState({
        isLoading: false,
        location: data.location,
        temperature: data.current.temp_c,
        condition: data.current.condition,
        icon: 'http:' + data.current.condition.icon,
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
      const latitude = 55.9485947
      const longitude = -3.1999135
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
      temperature,
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
        temperature={isCelsius ? temperature : toFahrenheit(temperature)}
        text={text}
        isCelsius={isCelsius}
        icon={icon}
      />
    )
  }
}

// For fun let's use some Higher Order Components
// See https://www.robinwieruch.de/gentle-introduction-higher-order-components/
const withLoading = Component => props =>
  <div>
    {props.isLoading ? <span>Loading...</span> : <Component {...props} />}
  </div>

const Panel = props =>
  <div style={weatherStyles}>
    <Temperature {...props} />
  </div>

const TemperatureWithLoading = compose(withLoading)(Panel)

let weatherStyles = {
  width: '300px',
  height: '150px',
  border: '1px solid #fdb',
  borderRadius: '3%',
  backgroundColor: '#ffd',
}

export default Weather
