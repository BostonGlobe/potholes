R:

	Rscript -e "rmarkdown::render('data/potholes.Rmd')"
	open data/potholes.html

R_deploy:

	cp data/potholes.html /Volumes/www_html/multimedia/graphics/projectFiles/Rmd/
	rsync -rv data/potholes_files /Volumes/www_html/multimedia/graphics/projectFiles/Rmd
	open http://private.boston.com/multimedia/graphics/projectFiles/Rmd/potholes.html

geo:

	cd data; rm -rf downloaded; mkdir downloaded; cd downloaded; curl https://raw.githubusercontent.com/BostonGlobe/shapefiles/master/MA/Boston/Boston.geojson > Boston.geojson; ogr2ogr -t_srs EPSG:4326 BOSTON.shp BOSTON.geojson;