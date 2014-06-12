var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
    crypto = require('crypto'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    InitService = require('./routes/InitService').InitService
    ManufactureService = require('./routes/ManufacturerService').ManufacturerService,
    ModelService = require('./routes/ModelService').ModelService,
    ServiceTypeService = require('./routes/ServiceTypeService').ServiceTypeService,
    JobService = require('./routes/JobService').JobService,
    manualService = require('./routes/ManualService').ManualService,
    taskService = require('./routes/TaskService').TaskService,
    fs = require("fs");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

var initService = new InitService('localhost', 27017);
initService.db(function(error, db){
    this.manufactureService = new ManufactureService(db);
    this.modelService = new ModelService(db);
    this.serviceTypeService = new ServiceTypeService(db);
    this.jobService = new JobService(db);
    this.manualService = new ManualService(db);
    this.taskService = new TaskService(db);
});

var varManufacturers = null;
var varModels = null;
var varServiceTypes = null;
var varJobs = null;
var varTasks = null;
var makeModelMap = {};

/////////////////////////////////////// Root ////////////////////////////////////////
app.get('/', function(req, res){
    manufactureService.findAll(function( error, manufacturers) {
        varManufacturers = manufacturers;    
    });

    modelService.findAll(function( error, models) {
        makeModelMap = {};
        varModels = models;  

        for (var i = 0; i < models.length; i++) {
            var makeTmp = models[i].make;
            var modelTmp = models[i].name;          

            if(makeModelMap[makeTmp] == undefined){
                makeModelMap[makeTmp] = modelTmp;
            } else {
                makeModelMap[makeTmp] = makeModelMap[makeTmp] + '#' + modelTmp;    
            }            
        };           
    });

    serviceTypeService.findAll(function( error, servicetypes) {
        varServiceTypes = servicetypes;    
    });

    jobService.findAll(function( error, jobs) {
        varJobs = jobs;
        res.render('index', {
            'title': 'Jobs',
            'jobs':jobs,
            'manufacturers': varManufacturers,
            'models': varModels,
            'serviceTypes': varServiceTypes,
            'makeModelMap': JSON.stringify(makeModelMap)
        });
    });
});

/////////////////////////////////////// Manufactures ////////////////////////////////
app.post('/manufacturer/save', function(req, res){
    var id = req.body.id;
    var name = req.body.name;
    var description = req.body.description;

    if(id == '-1'){
        id = crypto.randomBytes(20).toString('hex');
        manufactureService.save({
            'id': id,
            'name': name,
            'description': description
        }, function( error, docs) {
            res.redirect('/manufacturer')
        });    
    } else {
        manufactureService.update({
            'id': id,
            'name': name,
            'description': description
        }, function( error, docs) {
            res.redirect('/manufacturer')
        });    
    }   
});

app.get('/manufacturer', function(req, res){
    manufactureService.findAll(function( error, manufacturers) {
        varManufacturers = manufacturers;
        res.render('index', {
            'title': 'Manufacturers',
            'manufacturers': manufacturers
        });
    });
});

app.get('/manufacturer/:id', function(req, res){
	var id = req.params.id;	
	manufactureService.findOne(id, function(error, manufacturer){
		res.render('index', {
			'title': 'Manufacturers',
			'manufacturer':manufacturer,
			'manufacturers': varManufacturers
		});
	})
});

app.get('/manufacturer/remove/:id', function(req, res){
    var id = req.params.id; 
    manufactureService.remove(id, function( error, docs) {
        res.redirect('/manufacturer')
    });
});

/////////////////////////////////////// Model ////////////////////////////////
app.post('/model/save', function(req, res){
    var id = req.body.id;
    var make = req.body.make;
    var name = req.body.name;
    var description = req.body.description;

    if(id == '-1'){
        id = crypto.randomBytes(20).toString('hex');
        modelService.save({
            'id': id,
            'make': make,
            'name': name,
            'description': description        
        }, function( error, docs) {
            res.redirect('/model')
        });
    } else {
        modelService.update({
            'id': id,
            'make': make,
            'name': name,
            'description': description
        }, function( error, docs) {
            res.redirect('/model')
        });    
    }   
});

app.get('/model', function(req, res){
    modelService.findAll(function( error, models) {
        varModels = models;

        makeModelMap = {};
        for (var i = 0; i < models.length; i++) {
            var makeTmp = models[i].make;
            var modelTmp = models[i].name;          

            if(makeModelMap[makeTmp] == undefined){
                makeModelMap[makeTmp] = modelTmp;
            } else {
                makeModelMap[makeTmp] = makeModelMap[makeTmp] + '#' + modelTmp;    
            }            
        };   

        res.render('index', {
            'title': 'Models',
            'models': models,
            'manufacturers': varManufacturers
        });
    });
});

app.get('/model/:id', function(req, res){
    var id = req.params.id; 
    modelService.findOne(id, function(error, model){
        res.render('index', {
            'title': 'Models',
            'model': model,
            'models': varModels,            
            'manufacturers': varManufacturers
        });
    })
});

app.get('/model/remove/:id', function(req, res){
    var id = req.params.id; 
    modelService.remove(id, function( error, docs) {
        res.redirect('/model')
    });
});

/////////////////////////////////////// Service Types ////////////////////////////////
app.post('/servicetype/save', function(req, res){
    var id = req.body.id;
    var name = req.body.name;
    var description = req.body.description;
    
    if(id == '-1'){
        id = crypto.randomBytes(20).toString('hex');
        serviceTypeService.save({
            'id': id,            
            'name': name,
            'description': description
        }, function( error, docs) {
            res.redirect('/servicetype')
        });
    } else {
        serviceTypeService.update({
            'id': id,
            'name': name,
            'description': description
        }, function( error, docs) {
            res.redirect('/servicetype')
        });    
    }   
});

app.get('/servicetype', function(req, res){
	serviceTypeService.findAll(function( error, servicetypes) {
        varServiceTypes = servicetypes;
        res.render('index', {
            'title': 'Service Types',
            'servicetypes': servicetypes
        });
    });
});

app.get('/servicetype/:id', function(req, res){
    var id = req.params.id; 
    serviceTypeService.findOne(id, function(error, servicetype){
        res.render('index', {
            'title': 'Service Types',
            'servicetype': servicetype,
            'servicetypes': varServiceTypes
        });
    })
});

app.get('/servicetype/remove/:id', function(req, res){
    var id = req.params.id; 
    serviceTypeService.remove(id, function( error, docs) {
        res.redirect('/servicetype')
    });
});

/////////////////////////////////////// Jobs //////////////////////////////////////
app.post('/job/save', function(req, res){
	var id = req.body.id;
    var make = req.body.make;
    var model = req.body.model;
    var yom = req.body.yom;
    var rego = req.body.rego;
    var odo = req.body.odo;
    var servicetype = req.body.jobservicetype;
    var status = req.body.status;
    var fname = req.body.fname;
    var lname = req.body.lname;
    var contact = req.body.contact;
    var addressstreet = req.body.addressstreet;
    var addresssuburb = req.body.addresssuburb;
    var addresspostcode = req.body.addresspostcode;    
    var addressstate = req.body.addressstate;
    var note = req.body.note;
    var startdate = req.body.startdate;
    var completedate = req.body.completedate;

    if(id == '-1'){        
        id = crypto.randomBytes(20).toString('hex');
        jobService.save({
            'id': id,
            'make': make,
            'model': model,
            'yom': yom,
            'rego': rego,
            'odo': odo,            
            'servicetypes': servicetype,
            'status': status,
            'fname': fname,
            'lname': lname,
            'contact': contact,
            'addressstreet': addressstreet,
            'addresssuburb': addresssuburb,
            'addresspostcode': addresspostcode,
            'addressstate': addressstate,
            'note': note,
            'startdate': startdate,
            'completedate': completedate
        }, function( error, docs) {
            res.redirect('/job')
        });
    } else {
        jobService.update({
            'id': id,
            'make': make,
            'model': model,
            'yom': yom,
            'rego': rego,
            'odo': odo,            
            'servicetypes': servicetype,
            'status': status,
            'fname': fname,
            'lname': lname,
            'contact': contact,
            'addressstreet': addressstreet,
            'addresssuburb': addresssuburb,
            'addresspostcode': addresspostcode,
            'addressstate': addressstate,
            'note': note,
            'startdate': startdate,
            'completedate': completedate
        }, function( error, docs) {
            res.redirect('/job')
        });                 
    }   
});

app.get('/job', function(req, res){
    jobService.findAll(function( error, jobs) {        
        varJobs = jobs;
        res.render('index', {
            'title': 'Jobs',
            'jobs':jobs,
            'manufacturers': varManufacturers,
            'models': varModels,
            'serviceTypes': varServiceTypes,
            'makeModelMap': JSON.stringify(makeModelMap)
        });
    });
});

app.get('/job/:id', function(req, res){
    var id = req.params.id; 
    jobService.findOne(id, function(error, job){
        res.render('index', {
            'title': 'Jobs',
            'jobs': varJobs,
            'job': job,
            'manufacturers': varManufacturers,
            'models': varModels,
            'serviceTypes': varServiceTypes
        });
    })
});

app.get('/job/remove/:id', function(req, res){
    var id = req.params.id; 
    jobService.remove(id, function( error, docs) {
        res.redirect('/job')
    });
});

app.get('/search', function(req, res){    
    var keyword = req.query.keyword; 
    jobService.search(keyword, function(error, result){
        result.toArray(function(err, jobs){
            res.render('index', {
                'title': 'Jobs Search',
                'jobs': jobs,
                'manufacturers': varManufacturers,
                'models': varModels,
                'serviceTypes': varServiceTypes,
                'makeModelMap': JSON.stringify(makeModelMap)
            });                    
        });
    })
});

app.get('/job/print/:id', function(req, res){
    var id = req.params.id; 
    jobService.findOne(id, function( error, job) {        
        var url = 'http://localhost:3000/printjob/' + id;
        jobService.convertToPdf(job, url , function(error, doc){                
            var filename = job.rego + ".pdf";
            res.redirect('/job/download/'+ filename);                
        });
    });
});

app.get('/printjob/:id', function(req, res){
    var id = req.params.id; 
    jobService.findOne(id, function( error, job) {        
        res.render('printjob', {
            'job': job
        });
    });
});

app.get('/job/download/:filename', function(req, res){
    var filename = req.params.filename; 
    var file = __dirname + "\\public\\prints\\" + filename;

    // read file and send to browser
    fs.readFile(file, function (err,data){
        res.setHeader('Content-disposition', 'attatchment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');
        res.send(data);
    });
});

/////////////////////////////////////// Manual ////////////////////////////////
app.get('/manual', function(req, res){
    manualService.findAll(function( error, manuals) {        
        res.render('index', {
            'title': 'Manuals',
            'manuals': manuals,
            'manufacturers': varManufacturers,
            'models': varModels,
            'makeModelMap': JSON.stringify(makeModelMap)
        });
    });
});

app.post('/manual/save', function(req, res){
    var id = crypto.randomBytes(20).toString('hex');
    var make = req.body.make;
    var model = req.body.model;
    var data = fs.readFileSync(req.files.manualfile.path);
    var fileName = req.files.manualfile.name;

    manualService.save({
        'id': id,
        'make': make,
        'model': model,
        'data': data,
        'filename': fileName
    }, function( error, docs) {
        res.redirect('/manual')
    });
});

app.get('/manual/remove/:id', function(req, res){
    var id = req.params.id; 
    manualService.remove(id, function( error, docs) {
        res.redirect('/manual')
    });
});

app.get('/manual/:id', function(req, res){
    var id = req.params.id; 
    manualService.findOne(id, function(error, manual){

    	var file = __dirname + "\\public\\uploads\\" + manual.id + "\\" + manual.filename;
        fs.readFile(file, function (err,data){
            res.setHeader('Content-disposition', 'attatchment; filename="' + manual.filename + '"');
            res.setHeader('Content-type', 'application/pdf');
            res.send(data);
        });
    })
});

/////////////////////////////////////// Task ////////////////////////////////
app.post('/task/save', function(req, res){
    var id = req.body.id;    
    var name = req.body.name;
    var description = req.body.description;
        
    if(id == '-1'){
        id = crypto.randomBytes(20).toString('hex');
        taskService.save({
            'id': id,            
            'name': name,
            'description': description            
        }, function( error, docs) {
            res.redirect('/task')
        });
    } else {
        taskService.update({
            'id': id,
            'name': name,
            'description': description
        }, function( error, docs) {
            res.redirect('/task')
        });    
    }   
});

app.get('/task', function(req, res){
    taskService.findAll(function( error, tasks) {
        varTasks = tasks;
        res.render('index', {
            'title': 'Tasks',
            'tasks': tasks
        });
    });
});

app.get('/task/:id', function(req, res){
    var id = req.params.id; 
    taskService.findOne(id, function(error, task){
        res.render('index', {
            'title': 'Tasks',
            'task': task,
            'tasks': varTasks
        });
    })
});

app.get('/task/remove/:id', function(req, res){
    var id = req.params.id; 
    taskService.remove(id, function( error, docs) {
        res.redirect('/task')
    });
});

// create server
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});