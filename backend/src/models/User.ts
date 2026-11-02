import { Schema, model, type Document } from "mongoose";

export interface IFavourite {
    symbol: string;
    name: string;
    exchange?: string;
    addedAt: Date;
}

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    passwordHash: string;
    favourites: IFavourite[];
}

const favouriteSchema = new Schema<IFavourite>(
    {
        symbol: { type: String, required: true, uppercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        exchange: { type: String, default: "" },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const userSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true, select: false },
        favourites: { type: [favouriteSchema], default: [] },
    },
    { timestamps: true },
);

export default model<IUser>("User", userSchema);