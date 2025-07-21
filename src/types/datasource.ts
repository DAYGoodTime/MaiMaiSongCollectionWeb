export interface DataSource<T> {
    list:T,
    update_time:Date | string
}
export interface BasicScore {
    id:number,
    type:string,
    level_index:number,
    achievements:number
}