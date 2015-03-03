R:

	Rscript -e "rmarkdown::render('data/potholes.Rmd')"
	open data/potholes.html

R_deploy:

	cp data/potholes.html /Volumes/www_html/multimedia/graphics/projectFiles/Rmd/
	rsync -rv data/potholes_files /Volumes/www_html/multimedia/graphics/projectFiles/Rmd
	open http://private.boston.com/multimedia/graphics/projectFiles/Rmd/potholes.html