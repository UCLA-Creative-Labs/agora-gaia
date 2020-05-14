# PEN REST API

PEN stack to demo a REST API for web applications. REST API means ```REpresentational State Transfer``` and is an architectual style for designing web applications that require networking between client and application servers. A RESTful design allows for a separation between client and server and is visible, reliable and scalable. 

**Postgres**    -   Open-source relational database management system (RDBMS). https://www.postgresql.org/

**Express.js**  -   Web application framework for Node.js. https://expressjs.com/

**Node.js**     -   Open-source, JavaScript runtime environment that executes code outside of a browser https://nodejs.org/en/

We will take advantage of a module called ```node-postgres``` to have our ```node.js``` application easily interface with our Postgres server.

# Set Up

Unfortunately, OCI instances come with empty images that have no installed tools in it. OCI base images are essentially CentOS and use RPM to download modules. Whenever you need to download things always use the command ```sudo yum install -y <name of package>```.

## Installing Git and Obtaining this Repository

This git repo has the base template for quickly building up a 

```
Install git:

    sudo yum install -y git

Clone the repository:

    git clone https://github.com/UCLA-Creative-Labs/node-psql-rest.git

```

## Installing Dependencies and Requirements

We have a script to download all the stuff you need.

### Run

```
Install Dependencies, nvm, and open the firewall for port 3000:

    bash start.sh
```

### Breakdown

- update yum
- download nvm (node version manager)
    - use this to switch between node versions
    - run ```nvm install <node version number>``` for a specific version
    - run ```nvm use <node version number>``` to switch node version
    - run ```node --version``` to check
- download yarn
- install requirements 
- install node dependencies
- allow port access to 3000

Extensive documenation in ```start.sh```.

## Initializing Postgres Database 

We have a script to initialize a postgres server very quickly.

### Run

```
Initialize postgres database:

    bash psql.sh
```

### Breakdown

- init postgres
- start postgres
- create a user (call it 'opc' or whatever you want to use in ```queries.js```)
- create a database (call it 'api' or whatever you want to use in ```queries.js```)
- set password for user (user currently is defaulted to ```opc``` with a default password of ```test``` in ```queries.js```)
- create a table called ```users``` 
- populate ```users``` table with our bois Jerry and George

Extensive documenation in ```psql.sh```.

## Changing Postgres Authentication Method

Default authentication method is ```ident``` which requires an ident server to authenticate the user. Instead we switch to ```md5``` which is simply a hashed password authentication.

### Run the following code

```
First enter root user to access pqsl configuration file:

    sudo -i
    cd /var/lib/pgsql/data/
    vim pg_hba.conf

Replace the following with this:

    # TYPE  DATABASE        USER            ADDRESS                 METHOD

    # "local" is for Unix domain socket connections only
    local   all             all                                     peer
    # IPv4 local connections:
    #host    all             all             127.0.0.1/32            ident
    host    all             all             127.0.0.1/32            md5
    # IPv6 local connections:
    #host    all             all             ::1/128                 ident
    host    all             all             ::1/128                 md5

Finally run this outside of root user:

    psql -d <database_name> -c "SELECT pg_reload_conf();"
```
# Usage

Time to get this bad boi working. We have some base code here to show you how to navigate a RESTful API but the main benefits is to simply just download all the dependencies required to start.

The following documentation is to show you how to start up a server and prove that it works.

```
Start your node.js development server:

    npm start

Go to your VM instance's public ip address at specificied port in ```start.sh```. (Default is 3000)

    http://pub.lic.ip.add:3000/

You should see something like this:

    {
        info: "Node.js, Express, and Postgres API"
    }
```
```
Now simulate a GET request, go to:

    http://pub.lic.ip.add:3000/users

You should see something like this:

    [
        {
            "id": 1,
            "name": "Jerry",
            "email": "jerry@example.com"
        },
        {
            "id": 2,
            "name": "George",
            "email": "george@example.com"
        }
    ]
```
Congrats! You know have a backend server!

# Helpful Postgres Commands

Some commands to help you navigate the postgres server.

Link to cheatsheet: https://gist.github.com/Kartones/dd3ff5ec5ea238d4c546

## Terminal Commands
Some commands you can access in the terminal if bash is more of your cup of tea.

```
sudo -u postgres createuser --interactive       # Allows you to create a new user
sudo -u postgres createdb api                   # Creates a database with your current user

psql -d <name of database> -U <name of user>    # Allows you do start a psql connection to a database with specific user
psql <database>                                 # Allows you to login with current user in config to <database>
psql -d <name of database> -c 'psql code;'      # Allows you to run psql code for a desired database
```

## Inside Postgres Connection
Some commands to reference when inside the psql connect.

**Remember to add ';' to the end of your commands or they will not register!**

```
postgres=# \conninfo                    # See your connection info
postgres=# \list                        # List the databases
postgres=# \dt                          # List all tables in current database
postgres=# \du                          # List all users
postgres=# \c <name of database>        # Connect to a new database
postgres=# \password <username>         # Change password of selected user
postgres=# \q                           # Exit psql connection
```
