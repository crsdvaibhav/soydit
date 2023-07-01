import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType() //To tell graphql about this schema
@Entity() //Table
export class Post {

    @Field(()=>Int) //This will expose this field to graphql
    @PrimaryKey() //Columns
    id!: number;
    
    @Field(()=>String)
    @Property({type:"date"})
    createdAt?: Date = new Date();

    @Field(()=>String)
    @Property({ type:"date", onUpdate: () => new Date() })
    updatedAt?: Date = new Date();

    @Field()
    @Property({type: "text"})
    title!: string;
}