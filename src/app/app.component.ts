import { Component , OnInit,ViewChild,ElementRef} from '@angular/core';
import { Network, DataSet, Node, Edge, IdType} from 'vis';
import { detectChangesInRootView } from '../../node_modules/@angular/core/src/render3/instructions';

declare var vis:any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild("mynetwork") networkContainer: ElementRef;
  @ViewChild("graph") graphContainer:ElementRef;

  constructor() { }

    public nodes: DataSet<Node>;
    public edges: DataSet <Edge>;
    public network : Network;
    public data:{
      nodes:DataSet<Node>,
      edges: DataSet<Edge>
    };

    
    execTime:execObj[]=[];
    excObj:execObj={
      greedy:0,
      best:0
    }
    timeData;
    matchIds:any[];
    visited:boolean[];
    nb;
    b:any []=[]; //PERMUTATION MATRIX
    a:number []=[]; //a[i]=i
    edgeDistance:number=0;
    lastSelected=null;
    mincost=0;//BEST MINCOST
    greedyMinCost=0 // greedy mincost 
    path:IdType[]=[];
    greedyPath:IdType[]=[];
    isRandom:boolean=false;
    hasPhysics:boolean=false;
    
    ngOnInit(){
       
    }

    updateColor(path:IdType[]){
      var idu,idv;
      for(var i=0;i<path.length;i++){
        if (i==0){
          idu=this.matchIds[0];
          idv=this.edges.get(path[0]).to==idu?this.edges.get(path[0]).from:this.edges.get(path[0]).to;
        }else {
          idu=idv;
          idv=this.edges.get(path[i]).to==idu?this.edges.get(path[i]).from:this.edges.get(path[i]).to;
        } 
        this.edges.update({
          id:path[i],
          from:idu,
          to:idv,
          color:{color:'#dd2c00'},
          arrows: {
            middle: {enabled: true, scaleFactor:1, type:'arrow'},
          }
        })
      }
    }

    resetColors(){
      this.edges.forEach((e ,id)=>{
        this.edges.update({
          id:id,
          color:'lightgray',
          arrows: {
            middle: {enabled: false, scaleFactor:1, type:'arrow'},
          }        })
      })
    }

    async findGreedyPath(){
        this.resetColors();
        //await this.matchingIds();
        this.greedyMinCost=0;
        this.greedyPath=[];
        var current:IdType=this.matchIds[0];
        var next:IdType=null;
        var end=false;
        var marked=[];
        var min:number;
        var road;
        var e:Edge;
        var ed:Edge;
        
        marked.push(current);
        var t0=performance.now()
        while (!end) {
          min=700;
          next=null;
          
          await this.nodes.forEach( (n,id)=>{
            if (!marked.includes(id,0)){
              e= this.getEdge(current,id);
              if (e.value<min ) {
                min=e.value;
                next=id;
                road=e.id;
              }
            }
          })
          if (next==null){
            end=true;
            await (ed=this.getEdge(current,this.matchIds[0]));
            this.greedyMinCost+=ed.value;
            this.greedyPath.push(ed.id)
          }else{
            this.greedyMinCost+=min;
            marked.push(next);
            current=next;
            this.greedyPath.push(road);
          } 
        }
        var t1=performance.now();
        //this.excObj.greedy=(t1-t0);
        this.timeData.update({id:"greedy"+this.nodes.length,x:this.nodes.length,y:(t1-t0),group:1})
        /* if (this.excObj.best !=0){
          this.execTime.push({
            best:this.excObj.best,
            greedy:this.excObj.greedy
          });
          this.excObj.best=0;
          this.excObj.greedy=0;
        } */
        this.updateColor(this.greedyPath);
    }
        

    async findOptimalPath(){
      this.resetColors();
      //await this.matchingIds();
      await (this.b=[]);
      var t0=performance.now()
      await this.permut(this.a,this.nodes.length);
      await (this.minCost());
      var t1=performance.now();
      //this.excObj.best=(t1-t0);
      this.timeData.update({id:"best"+this.nodes.length,x:this.a.length,y:(t1-t0),group:0,label:"x"});
      console.log(this.timeData)
        /* if (this.excObj.greedy !=0){
          this.execTime.push({
            best:this.excObj.best,
            greedy:this.excObj.greedy
          })          
          this.excObj.best=0;
          this.excObj.greedy=0;
        } */
      await (this.updateColor(this.path))
    }

    async minCost(){
      var cost=0,d:number=0,e:Edge,idu,idv;
      this.path=[];
      var path:IdType[]=[];
      this.mincost=0;
      for(var i=0;i<this.b.length;i++){
        cost=0;
        path=[]
        if (this.b[i][0]==0){//Start from the city with label 0;
          for(var j=0;j<this.a.length;j++){
            idu=this.matchIds[this.b[i][j]];
            idv=this.matchIds[this.b[i][(j+1)% this.a.length]];
            await (e=this.getEdge(idu,idv));
            cost+=e.value;
            path.push(e.id);
          }
          if (cost<=this.mincost || this.mincost==0){
            this.mincost=cost;
            this.path=path;
          }
        }
      }
    }

    getEdge(idu:IdType,idv:IdType):Edge{
        var ed;
        this.edges.forEach( (e,id)=>{
          if ((e.from==idu && e.to==idv)||(e.from==idv && e.to==idu)){
             ed = e; 
          } 
        })
        return ed;
    }



    updateEdge(){
      console.log(this.execTime);
      if (this.edgeDistance!=0 && this.lastSelected!=null)
       this.edges.update({id:this.lastSelected,
                          value:this.edgeDistance,
                          label:this.edgeDistance.toString()
                        });
    }

    drawCompleteGraph(){
      this.mincost=0;this.greedyMinCost=0;
      this.matchingIds();
      this.edges.clear();
      var x:Edge;
      var marked=[];
        this.nodes.forEach((u,idu)=>{
          marked.push(idu);
          this.nodes.forEach((v,idv)=>{
            if (idu!=idv && !marked.includes(idv,0)){
              var val=this.isRandom?Math.floor(Math.random() * 3) + 1:0;
              x={from:idu,to:idv,value:val,label:val.toString()};
              this.edges.update(x);
            } 
          })
        })
    }

    addPermutation(a){
      var x=[];
      for (var i=0;i<a.length;i++){
        x.push(a[i]);
      }
      this.b.push(x);
    }
    async permut(a:number[],n:number){
        if (n==1){
          await this.addPermutation(a);
        }
        for (var i=0; i<n; i++) 
        { 
            await this.permut(a,n-1); 
            if (n % 2 == 1) 
            { 
                var temp = a[0]; 
                a[0] = a[n-1]; 
                a[n-1] = temp; 
            } 
            else
            { 
                var temp = a[i]; 
                a[i] = a[n-1]; 
                a[n-1] = temp; 
            } 
        } 
    }


    matchingIds(){//JUST TO MAP A TYPEID WITH THE VISITED INDEXES
      var i=0;
      this.matchIds=[];
      this.a=[];
      this.nodes.forEach((n,id)=>{
        this.matchIds[i]=id;
        this.a[i]=i;
        this.nodes.update({id:id,label:i.toString()})
        i++
      })

    }

    getIndexById(id){
      for (var i=0;i<this.matchIds.length;i++){
        if (this.matchIds[i]==id) return (i)
      }
    }

    showHelp(){
      alert("koko")
    }

    TogglePhysics(){
      console.log(this.hasPhysics)
      this.hasPhysics=!this.hasPhysics;
      this.network.setOptions({
        physics:{
          enabled:this.hasPhysics
      }})

    }

    public async ngAfterViewInit() {

          this.nodes = new vis.DataSet([
              {id: 1},
              {id: 2},
              {id: 3},
              {id: 4},
              {id: 5} 
          ])

            this.edges =new vis.DataSet([
              {from: 1, to: 3},
              {from: 1, to: 2},
              {from: 2, to: 4},
              {from: 2, to: 5} 
            ]);
           // create a network
           var container = this.networkContainer.nativeElement;

           this.data = {
            nodes: this.nodes,
            edges: this.edges
          };
          var opt = {
              physics:{
                enabled:true
              },
              nodes: {
                borderWidth:4,
                size:30,
                shape: 'circularImage', 
                image: "",
              color: {
                  border: '#222222',
                  background: '#666666'
                },
                font:{
                 //size:0, //A WORKAROUND LOL, JUST TO DISABLE LABELS (I DONT LIKE 'EM)
                  color:'#eeeeee'}
              },
              edges: {
                color: 'lightgray',
                scaling:{
                  min:1,
                  max:1,
                  label:{
                    enabled:false
                  }
                },
                arrows: {
                  middle: {enabled: false, scaleFactor:1, type:'arrow'},
                }
              },
            manipulation: {
              enabled: true
            },
            interaction: {
              selectConnectedEdges:false
            }
          };
           await (this.network = new vis.Network(container, this.data, opt));
           this.network.on("selectEdge",(params)=>{
            this.lastSelected=params.edges[0];            
          })

          


          var graphcontainer = this.graphContainer.nativeElement;
        
          this.timeData = new vis.DataSet([
            {id:"best5",x:5,y:12,group:0}
          ]);
          var options = {
            height:'100%',
            width:'100%',
            clickToUse:true,
            format: {
            minorLabels: {
                millisecond: 'x',
                second: 'x',
                minute: 'x',
                hour: 'x',
                weekday: 'x',
                day: 'x',
                month: 'x',
                year: 'x'
            },
            majorLabels: {
                millisecond: '',
                second: '',
                minute: '',
                hour: '',
                weekday: '',
                day: '',
                month: '',
                year: ''
            }
        },
        timeAxis: {scale: 'millisecond', step: 1}
    };
          var graph2d = new vis.Graph2d(graphcontainer, this.timeData, options);     
          
        }  
    
}

interface execObj {
    greedy:number,
    best:number,
}
