R:

	Rscript -e "rmarkdown::render('data/potholes.Rmd')"
	open data/potholes.html

R_deploy:

	cp data/potholes.html /Volumes/www_html/multimedia/graphics/projectFiles/Rmd/
	rsync -rv data/potholes_files /Volumes/www_html/multimedia/graphics/projectFiles/Rmd
	open http://private.boston.com/multimedia/graphics/projectFiles/Rmd/potholes.html

geo:

	cd data; rm -rf downloaded; mkdir downloaded; cd downloaded; curl https://raw.githubusercontent.com/BostonGlobe/shapefiles/master/MA/Boston/Boston.geojson > Boston.geojson; ogr2ogr -t_srs EPSG:4326 BOSTON.shp BOSTON.geojson;

dotmap:

	# convert potholes.csv to geojson
	csvcut potholes.csv -c LATITUDE,LONGITUDE | csvgrep -c LONGITUDE,LATITUDE -r "^$$" -i | csvjson --lat LATITUDE --lon LONGITUDE -i 4 > potholes.geojson

encodetiles:

	rm -rf datamaps;
	csvcut potholes.csv -c LATITUDE,LONGITUDE | csvgrep -c LONGITUDE,LATITUDE -r "^$$" -i | sed "1 d" | ~/Documents/other/datamaps/encode -o datamaps -z 18;

makepng:

	~/Documents/other/datamaps/render -B 13:0.05917:1.23 -c FF0000 -A -- datamaps 13 42.2322 -71.1857 42.3933 -70.9962 > datamaps.png

maketiles:

	# -c FF0000 


	# ~/Documents/other/datamaps/enumerate -z12 -Z12 datamaps | xargs -L1 -P8 ~/Documents/other/datamaps/render -pg1 -B 10:0.05917:1.23 -c FF0000 > datamaps.png;

	# ~/Documents/other/datamaps/enumerate -z18 datamaps | xargs -L1 -P8 ~/Documents/other/datamaps/render -pg1 -B 10:0.05917:1.23 -c FF0000 > datamaps.png;


	# ~/Documents/other/datamaps/enumerate -z18 datamaps | xargs -L1 -P8 ~/Documents/other/datamaps/render

	#  -A -- datamaps 13 42.2322 -71.1857 42.3933 -70.9962 -B 10:0.05917:1.23 -c FF0000 > datamaps.png


	# ~/Documents/other/datamaps/render -A -- datamaps 13 42.2322 -71.1857 42.3933 -70.9962 -B 10:0.05917:1.23 -c FF0000 > datamaps.png




