const core=require('@actions/core')
const exec=require('@actions/exec')
const proc=require('process')

function exit(status){
    exec.exec("docker logout").then(()=>proc.exit(status));
}

function get_meson_options(){
    let options=core.getInput('options');
    switch(core.getInput('sanitizer')){
        case 'none':
            core.info("not using a sanitizer");
            break;
        case 'address':
            core.info("using address sanitizer");
            options+=" -Db_sanitize=address";
            break;
        case 'thread':
            core.info("using thread sanitizer");
            options+=" -Db_sanitize=thread";
            break;
        case 'ub':
        case 'undefined':
            core.info("using undefined behaviour sanitizer");
            options+=" -Db_sanitize=undefined";
            break;
        case 'memory':
            core.info("using memory sanitizer");
            options+=" -Db_sanitize=memory";
            break;
        default:
            core.setFailed(`${core.getInput('options')} is not a valid sanitizer.`);
            exit(1);
        }
    return options;
}

class docker {
    constructor(image){
        this.image=image;
   }
static async init(image){

    let auth=null;

    {
        let username=core.getInput("username");
        let password=core.getInput("password");
        let registry=core.getInput("registry");
        if((!username)&&(!pasword)&&(!registry));
        else if(username&&password){
            auth={username:username,password:password};
            if(registry)auth.registry=registry;
        }else{
            core.setFailed('If one of "usernamer", "password", "registry" is specified, the first two are required!');
            exit(1);
        }
    }
    
    core.startGroup("setup docker environment");
       if(auth!==null){
           core.setCommandEcho(false);
           let status=await exec.exec(`docker login -u ${auth.username} -p ${auth.password} ${auth.registry}`)
           core.setCommandEcho(core.isDebug());
           if(status!==0){
               core.setFailed(`docker login failed with exit code ${status}`);
               exit(status);
           }
       }

    let status=await exec.exec(`docker pull ${image}`);
    if(status!==0){
        core.setFailed(`docker pull failed with exit code ${status}`);
        exit(status);
    }
    
    core.endGroup();
    return new docker(image);
}
    async run(command,options={}){
        let status=await exec.exec(`docker run --rm -w="/workdir" --mount "type=bind,source=${proc.cwd()},destination=/workdir" ${this.image} ${command}`,options=options);
        if(status!==0){
            core.setFailed(`docker run exited with exit code ${status}`);
            exit(status);
        }
    }

    async run_block(command,block,options={}){
        core.startGroup(block);
        this.run(command,options);
        core.endGroup();
    }
}

const image_map=new Map([
    ["arch-gcc","docker.pkg.github.com/robinmarchart/meson-builder/arch-gcc:latest"],
    ["arch-clang","docker.pkg.github.com/robinmarchart/meson-builder/arch-clang:latest"],
    ["debian-clang","docker.pkg.github.com/robinmarchart/meson-builder/debian-clang:latest"],
    ["debian-gcc","docker.pkg.github.com/robinmarchart/meson-builder/debian-gcc:latest"]
]);

async function main(){
    let build_dir=core.getInput("build_dir",{required:true});
    let docker=await docker.init(image_map.get(core.getInput("image",{required:true})));
    await docker.run_block(`meson setup ${get_meson_options()} "${build_dir}"`,"initialize meson");
    await docker.run_block(`meson configure "${build_dir}"`,"show project options");
    await docker.run_block(`meson compile -C "${build_dir}"`,"compile project");
    await docker.run_block(`meson test -C "${build_bir}"`,"Run Tests");
    exit(0);
}


main().catch(e=>{
    core.setFailed(JSON.stringify(e));
    exit(1);
});

