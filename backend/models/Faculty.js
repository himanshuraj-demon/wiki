import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Faculty email is required'],
      trim: true,
      lowercase: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    designation: {
      type: String,
      default: 'Assistant Professor',
    },
    researchInterests: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: '',
    },
    office: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
