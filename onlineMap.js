// getting coordinates has to be wrapped in function to ensure right index being processed after request is finished
function get_coords(location,marker,idx) {
  
  //could implement loop here to check for ct < 10 and wait
  marker.geocode_ct++;   // track number of requests being made
  
  // send request and handle callback
  geocoder.geocode(location, function(results) {
      marker.Markers[idx].geometry.coordinates = [results[0].center.lng, results[0].center.lat];
      marker.geocode_ct--;
      // if all requests of this mark are finished, plot markers
      if (marker.geocode_ct==0) {
          plotData(marker)
      }
  });
}


function readMarkers(json) {
    
    var idx = sheet.ct-1;   // setting idx to be static after ajax request for data is sent
    sheet.ct++;             // advancing to next sheet in document
    var data = json.feed.entry;   // getting data from online database
    
    marker[idx] = {Topics:[],Markers:[],geocode_ct:0,loaded:false};   // preassigning data structure
    for(var i=0; i<data.length; i++) {
        var cell = data[i]["gs$cell"];
        var val = cell["$t"];
//         console.log(val)
        if (cell.row == 1) {
          marker[idx].Topics[cell.col-1] = val;
        }
        else {
          if (cell.col == 1) {
            marker[idx].Markers[cell.row-2] = {
              "type": "Feature",
              "properties": {
              },
              "activity": { 
                  "marker":   idx,
                  "clicked":  false,
                  "visible":  1,
              },
              "geometry": {
                  "type": "Point",
                  "coordinates": []   // specify as [lng,lat]
              }
            }
          }
          marker[idx].Markers[cell.row-2].properties[cell.col-1] = val;
          switch (cell.col) {
            case "1":
              get_coords(val,marker[idx],cell.row-2);
              break;
            case "7":
//               marker.Markers[cell.row-2].properties.contact = val;  // email addresses with an (at) to ensure data safety, web addresses as link (add href)
              break;
//             case "9":
//               marker.Markers[cell.row-2].properties.icon_url = val;   // ak logo for AK projects, estonteco logo for BuLa groups, what for partnergroups?
//               break;
          }
        }
    }
    toggle_menu("#mm_"+(idx+1),0);    // enabling toggle on-/off- of marker hide function
}


function readCountries(json) {
    
//     var idx = sheet.ct-1;   // setting idx to be static after ajax request for data is sent
//     sheet.ct++;             // advancing to next sheet in document
    console.log("loading countries from database")
    var data = json.feed.entry;   // getting data from online database
    
    for(var i=0; i<data.length; i++) {
        var cell = data[i]["gs$cell"];
        var val = cell["$t"];
//         console.log(val)
        if (cell.row == 1) {
          if (cell.col == 1) {
            countries.Topics = [];
          }
          countries["Topics"][cell.col-1] = val;
        }
        else {
          if (cell.col == 1) {
            countries[val] = {};
            country_tag = val;
          }
          else {
            countries[country_tag][cell.col-1] = val;
          }
        }
    }
    console.log(countries)
}




function plotData(marker) {
    
    if (marker.loaded) {    // shouldn't be needed - but keep until everything runs smoothly!
      alert("already loaded")
    }
    else {
      
      function onEachFeature(feature, layer) {
        layer.on('click',function (e) {
            if (feature.activity.clicked) {
              reset_infobox();
              selected = [null,null];
              feature.activity.clicked = false;
            }
            else {
              document.getElementById("info_title").innerHTML = "<b>" + feature.properties[1] + "</b>, " + feature.properties[2];
              
              document.getElementById("info_place_tag").innerHTML = "<b>" + marker.Topics[0] + "</b>";
              document.getElementById("info_place_content").innerHTML = feature.properties[0];
              
              document.getElementById("info_descr_tag").innerHTML = "<b>" + marker.Topics[3] + "</b>";
              document.getElementById("info_descr_content").innerHTML = feature.properties[3];
              
              document.getElementById("info_poss_tag").innerHTML = "<b>" + marker.Topics[4] + "</b>";
              document.getElementById("info_poss_content").innerHTML = feature.properties[4];
              
              document.getElementById("info_currposs_tag").innerHTML = "<b>" + marker.Topics[5] + "</b>";
              document.getElementById("info_currposs_content").innerHTML = feature.properties[5];
              
              // replace "@" with "(at) for protection against webcrawlers or so
              // if begins with "www", make it a href
              document.getElementById("info_contact_tag").innerHTML = "<b>" + marker.Topics[6] + "</b>";
              document.getElementById("info_contact_content").innerHTML = feature.properties[6];
              
              document.getElementById("info_image").src= feature.properties[7];
              selected = feature.activity.marker;
              feature.activity.clicked = true;
            }
        });
        layer.bindPopup(feature.properties[2] + ", " + feature.properties[1])
        
      }
      
      
      marker.handle = L.geoJSON(marker.Markers, {
          pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: L.icon({iconUrl: feature.properties[8],
                                                    iconSize: [30, 30],
                                                    popupAnchor: [0, -15]
                                                  }),
                                      riseOnHover:true
                                    });
            },
          onEachFeature: onEachFeature
      }).addTo(map);
      marker.loaded = true;
      
    }
}

function mapFilter(marker_idx,id) {
  
  if (marker[marker_idx].loaded) {
    var status_act = $("#"+id).attr("active");
    toggle_menu("#"+id,status_act)
    
    if (status_act==0) {
      map.addLayer(marker[marker_idx].handle)
    }
    else {
      map.removeLayer(marker[marker_idx].handle)
      if (marker_idx == selected) {
        reset_infobox();
        map.closePopup();
      }
    }
      
  //   toggleFilter("mm_wz") //maybe possible to write single filter function for all, when object id is passed through function call?!
  }
}

function toggle_menu(id,status) {
  if (status==0) {
    $(id).css({"color":"black","background-color":"#ffcb04"});
    $(id).attr("active",1);
  }
  else {
    $(id).css({"color":"gray","background-color":"#FFFFFF"});
    $(id).attr("active",0);
  }
}



function reset_infobox() {
  document.getElementById("info_title").innerHTML = "<b> Dies ist eine Infobox </b>";
  
  document.getElementById("info_place_tag").innerHTML = "";
  document.getElementById("info_place_content").innerHTML = "Wähle die reiter über der Karte, um Marker ein- und auszublenden";

  document.getElementById("info_descr_tag").innerHTML = "";
  document.getElementById("info_descr_content").innerHTML = "Wähle einen Marker auf der Karte aus, um mehr über internationale Möglichkeiten im BdP zu erfahren!";

  document.getElementById("info_poss_tag").innerHTML = "";
  document.getElementById("info_poss_content").innerHTML = "";

  document.getElementById("info_currposs_tag").innerHTML = "";
  document.getElementById("info_currposs_content").innerHTML = "";

  document.getElementById("info_contact_tag").innerHTML = "";
  document.getElementById("info_contact_content").innerHTML = "";

  document.getElementById("info_image").src= "";
  
  
  document.getElementById("info_country_name").innerHTML = "<b> Kein Land ausgewählt </b>";
  
  document.getElementById("info_country_descr_tag").innerHTML = "";
  document.getElementById("info_country_descr_content").innerHTML = "Klicke auf ein Land auf der Weltkarte um nähere Informationen zu erhalten";
  
  document.getElementById("info_country_contact_tag").innerHTML = "";
  document.getElementById("info_country_contact_content").innerHTML = "";
  
  document.getElementById("info_country_links_tag").innerHTML = "";
  document.getElementById("info_country_links_content").innerHTML = "";
}

function unselect_all() {
  reset_infobox();
  map.closePopup();
}


function onMapClick(e) {
  
  reset_infobox()
  $("#submitCountry").css("display","none")
  var database_entry = false;
  
  geocoder.reverse(e.latlng, map.getZoom(), function(results) {
//       marker.Markers[idx].geometry.coordinates = [results[0].center.lng, results[0].center.lat];
      marker.geocode_ct--;
      console.log(results[0].name)
      var re = new RegExp(', ');
      var address = results[0].name.split(re);
      console.log(address)
      var country = address[address.length-1];
      
      
      
      
      var keys = Object.keys(countries);
      
      
      
      
      if (keys.indexOf(country) !== -1) {
        popup
          .setLatLng(e.latlng)
          .setContent(countries[country][1])
          .openOn(map);
        
        document.getElementById("info_country_name").innerHTML = "<b> " + countries[country][1] + " </b>";
        
        document.getElementById("info_country_descr_tag").innerHTML = "<b> " + countries["Topics"][2] + " </b>";
        document.getElementById("info_country_descr_content").innerHTML = countries[country][2];
        
        document.getElementById("info_country_contact_tag").innerHTML = "<b> " + countries["Topics"][3] + " </b>";
        document.getElementById("info_country_contact_content").innerHTML = countries[country][3];
        
        document.getElementById("info_country_links_tag").innerHTML = "<b> " + countries["Topics"][4] + " </b>";
        document.getElementById("info_country_links_content").innerHTML = countries[country][4];
        
      }
      else {
        popup
          .setLatLng(e.latlng)
          .setContent(country)
          .openOn(map);
        
        document.getElementById("info_country_name").innerHTML = "<b> " + country + " </b>";
        document.getElementById("info_country_descr_tag").innerHTML = "";
        document.getElementById("info_country_descr_content").innerHTML = "Für " + country + " ist noch kein Eintrag in der Datenbank vorhanden. Fülle das folgende Formular aus, um einen Eintrag zu erstellen!";
        
        $("#submitCountry").css("display","inline")
      }
        
      // results has to be stripped of the unneeded string parts - only last part needed
      // if country is already in database, display information.
      // if not, get form, to fill in data that can be submitted (and written to the database)
      // data can also be updated, when already present
      
      
      // if all requests of this mark are finished, plot markers
//       if (marker.geocode_ct==0) {
//           plotData(marker)
//       }
  });
}