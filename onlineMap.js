// getting coordinates has to be wrapped in function to ensure right index being processed after request is finished
function get_coords(location,mark,idx) {
  
  //could implement loop here to check for ct < 10 and wait
  mark.geocode_ct++;   // track number of requests being made
  
  // send request and handle callback
  geocoder.geocode(location, function(results) {
      mark.Markers[idx].geometry.coordinates = [results[0].center.lng, results[0].center.lat];
      mark.geocode_ct--;
      // if all requests of this mark are finished, plot markers
      if (mark.geocode_ct==0) {
          plotData(mark)
      }
  });
}


function loadData(url,mark) {
  
  // obtain data from spreadsheet (change to online)
  var xhr = $.ajax({
    mimeType: 'text/plain; charset=utf-8',
    url:      url,
    type:     "GET",
    dataType: "text",
    success:  function(result) {
      
      var split_data = result.split(/\r?\n|\r/);
      for (var i=0;i<split_data.length;i++) {
        var vals = split_data[i].split(";");
        
        if (i==0) {
//           write topics
          for (var j=0;j<vals.length;j++) {
            mark.Topics[j] = vals[j];
          }
        }
        else if (vals.length == mark.Topics.length) {
//           write markers
          mark.Markers[i-1] = {
            "type": "Feature",
            "properties": {
                "place":  vals[0],
                "name": vals[1],
                "popupContent": vals[1],
                "shortdescription": vals[2],
                "description": vals[3],
                "possibilities": vals[4],
                "currentpossibilities": vals[5],
                "contact":  vals[6],
                "image": vals[7],
                "icon_url": vals[8]       // ak logo for AK projects, estonteco logo for BuLa groups, what for partnergroups?
            },
            "geometry": {
                "type": "Point",
                "coordinates": []   // specify as [lng,lat]
            }
          };
          get_coords(vals[0],mark,i-1)   
        }
      }
    },
    error:    function() {
      alert("Something went wrong")
    }
  });
}

function plotData(mark) {
    
    if (mark.loaded) {    // shouldn't be needed - but keep until everything runs smoothly!
      alert("already loaded")
    }
    else {
      
      function onEachFeature(feature, layer) {
        layer.on('click',function (e) {
            document.getElementById("info_title").innerHTML = "<b>" + feature.properties.name + "</b>, " + feature.properties.shortdescription;
            document.getElementById("info_place").innerHTML = "<b>" + mark.Topics[0] + ":</b> " + feature.properties.place;
            document.getElementById("info_descr").innerHTML = "<b>" + mark.Topics[3] + ":</b> " + feature.properties.description;
            document.getElementById("info_contact").innerHTML = "<b>" + mark.Topics[6] + ":</b> " + feature.properties.contact;
            document.getElementById("info_poss").innerHTML = "<b>" + mark.Topics[4] + ":</b> " + feature.properties.possibilities;
            document.getElementById("info_currposs").innerHTML = "<b>" + mark.Topics[5] + ":</b> " + feature.properties.possibilities;
            document.getElementById("info_image").src= feature.properties.image;
            console.log(feature.style)
        });
        layer.bindPopup(feature.properties.popupContent)
      }
      
      
      mark.handle = L.geoJSON(mark.Markers, {
          pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: L.icon({iconUrl: feature.properties.icon_url,
                                                    iconSize: [30, 30],
                                                    popupAnchor: [0, -15]
                                                  }),
                                      riseOnHover:true
                                    });
            },
          onEachFeature: onEachFeature
      }).addTo(map);
      mark.loaded = true;
      
//       mapFilter(mark,"mm_wz")
//       mapFilter(mark,"mm_partners")
      
    }
}

function mapFilter(mark,id) {
  
  if (mark.loaded) {
    var status_act = $("#"+id).attr("active");
    toggle_menu("#"+id,status_act)
    
    if (status_act==0) {
      map.addLayer(mark.handle)
    }
    else {
      map.removeLayer(mark.handle)
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