import "./styles/main.scss"
import "leaflet/dist/leaflet.css"
import React, { useState, useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import { Map, Pane, Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import Leaflet from "leaflet"
import { v4 as uuidv4 } from "uuid"
import AsyncSelect from "react-select/async"
import Axios from "axios"

const mapPinIcon = new Leaflet.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.0.1/dist/images/marker-icon.png",
  iconSize: new Leaflet.Point(25, 41),
  iconAnchor: [12.5, 41],
  popupAnchor: [0, -41]
})

const mapPackageIcon = new Leaflet.Icon({
  iconUrl: "https://icon-library.com/images/box-icon/box-icon-9.jpg",
  iconSize: new Leaflet.Point(40, 51),
  iconAnchor: [12.5, 41],
  popupAnchor: [0, -41]
})

const initialPosition = { lat: -23.5633697, lng: -46.6379345 }

const ACCESS_TOKEN_MAP_BOX = `access_token=${process.env.REACT_APP_ACCESS_TOKEN_MAP_BOX}`

function App() {
  const [deliveries, setDeliveries] = useState([])
  const [name, setName] = useState("")
  const [complement, setComplement] = useState("")
  const [address, setAddress] = useState(null)
  const [position, setPosition] = useState(null)
  const [location, setLocation] = useState(initialPosition)

  function LocationMarker() {
    const map = useMap()

    // useEffect(() => {
    //   map.locate().on("locationfound", event => {
    //     if (event.latlng !== null) {
    //       setPosition(event.latlng)
    //       map.flyTo(event.latlng, 16)
    //     }
    //   })
    // }, [map])

    map.on("click", event => {
      setLocation(event.latlng)
      getLocation()
      console.log(location)
    })

    useEffect(() => {
      if (position) {
        map.flyTo(position, 16)
      }
    }, [position])

    return position === null ? null : (
      <Marker position={position} icon={mapPinIcon}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    )
  }

  function handleChangeSelect(event) {
    setPosition({
      lng: event.coords[0],
      lat: event.coords[1]
    })

    setAddress({
      label: event.place,
      value: event.place
    })

    setLocation({
      lng: event.coords[0],
      lat: event.coords[1]
    })

    console.log(position)
    console.log(address)
    console.log(location)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!address || !name) return

    setDeliveries([
      ...deliveries,
      {
        id: uuidv4(),
        name: name,
        address: address,
        complement: complement,
        latitude: location.lat,
        longitude: location.lng
      }
    ])

    console.log(deliveries)

    setName("")
    setAddress(null)
    setComplement("")
    setPosition(null)
  }

  async function getLocation() {
    const response = await Axios.get(`http://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json?${ACCESS_TOKEN_MAP_BOX}`)

    if (response) {
      setAddress(response.data.features[0].place_name)
    }

    console.log(address)
  }

  async function loadOptions(input, callback) {
    if (input.length < 5) return
    let places = []
    const response = await Axios.get(`http://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?${ACCESS_TOKEN_MAP_BOX}`)

    if (response) {
      response.data.features.map(item => {
        places.push({
          label: item.place_name,
          value: item.place_name,
          coords: item.center,
          place: item.place_name
        })
      })
    }

    callback(places)
  }

  return (
    <div id="page-map">
      <main>
        <form onSubmit={handleSubmit} className="landing-page-form" disabled={!address || !name}>
          <fieldset>
            <legend>Entregas</legend>
            <div className="input-block">
              <label htmlFor="nome">Nome</label>
              <input autoComplete="none" value={name} onChange={event => setName(event.target.value)} type="text" id="name" placeholder="Digite seu nome" />
            </div>

            <div className="input-block">
              <label htmlFor="address">Endereço</label>
              <AsyncSelect placeholder="Digite seu endereço..." cacheOptions onChange={handleChangeSelect} value={address} loadOptions={loadOptions} classNamePrefix="filter" />
            </div>

            <div className="input-block">
              <label htmlFor="complement">Complemento</label>
              <input autoComplete="none" value={complement} type="text" onChange={event => setComplement(event.target.value)} placeholder="Apto / Nr / Casa..." id="complement" />
            </div>

            <div className="input-block">
              <label htmlFor="date">Data de Entrega</label>
              <input autoComplete="none" type="date" placeholder="Apto / Nr / Casa..." id="complement" />
            </div>
          </fieldset>

          <button className="confirm-button" type="submit">
            Confirmar
          </button>
        </form>
      </main>

      <MapContainer className="map-container" center={location} zoom={15} scrollWheelZoom={true} style={{ width: "100%", height: "100%" }}>
        <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />

        {/* {position && <Marker icon={icon} position={[position.lat, position.lng]}></Marker>} */}

        {deliveries.map(delivery => {
          return (
            <Marker key={delivery.id} icon={mapPackageIcon} position={[delivery.latitude, delivery.longitude]}>
              <Popup closeButton={false} minWidth={240} maxWidth={240}>
                <div className="map-popup">
                  <h3>{delivery.name ? delivery.name : ""}</h3>
                  <p>
                    {delivery.address.label} - {delivery.complement ? delivery.complement : ""}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("app"))

if (module.hot) {
  module.hot.accept()
}
